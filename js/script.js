// ============================================
// FreelanceEscrow - Frontend JavaScript
// ============================================

document.addEventListener("DOMContentLoaded", async () => {  // ==========================================
  // 1. THEME TOGGLE
  // ==========================================

  const themeToggle = document.getElementById("theme-toggle");

  // Load previously selected theme
  const savedTheme = localStorage.getItem("freelanceEscrowTheme");

  if (savedTheme === "dark") {
    document.body.classList.add("dark-theme");
    themeToggle.setAttribute("aria-pressed", "true");
  }

  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-theme");

    const isDark = document.body.classList.contains("dark-theme");

    themeToggle.setAttribute("aria-pressed", isDark);

    localStorage.setItem("freelanceEscrowTheme", isDark ? "dark" : "light");
  });

  // ==========================================
  // 2. SMOOTH NAVIGATION
  // ==========================================

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");

      if (!targetId || targetId === "#") {
        return;
      }

      const target = document.querySelector(targetId);

      if (target) {
        event.preventDefault();

        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  });

  // ==========================================
  // 3. SEARCH FUNCTION
  // ==========================================

  const browseSearch = document.getElementById("job-search");
  const browseJobList = document.getElementById("browse-job-list");

    // AWS API
  const API_URL =
  "https://g4ol2tmae2b7kb4ooaucc5zdq40igkhn.lambda-url.ap-south-1.on.aws";

  // Load jobs from AWS
  async function loadJobsFromAPI() {
    try {
      const response = await fetch(`${API_URL}/jobs`);

      if (!response.ok) {
        throw new Error("Failed to load jobs");
      }

      const jobs = await response.json();

      // Clear current hardcoded jobs
      browseJobList.innerHTML = "";

      jobs.forEach((job) => {
        const card = document.createElement("article");

        card.className = "browse-job-card";
        card.dataset.jobId = job.jobId;
        card.id = job.jobId;

        card.innerHTML = `
          <div>
            <h3>${job.title}</h3>
            <p>${job.description}</p>
            <p>
              <strong>Category:</strong> ${job.category}
            </p>
            <p>
              <strong>Budget:</strong> ${job.budget} ETH
            </p>
            <p>
              <strong>Job Type:</strong> ${job.jobType}
            </p>
            <p>
              <strong>Deadline:</strong> ${job.deadline || "Not specified"}
            </p>
          </div>

          <button class="btn-apply-job" type="button">
            Apply
          </button>
        `;

                // Show applicants and selection controls for the client
        if (
            job.clientId === connectedWallet &&
            Array.isArray(job.applications) &&
            job.applications.length > 0
        ) {
            const applicationsBox = document.createElement("div");
            applicationsBox.className = "job-applications";

            const applicationsTitle = document.createElement("strong");
            applicationsTitle.textContent = "Applicants:";
            applicationsBox.appendChild(applicationsTitle);

            job.applications.forEach((application) => {
                const applicantRow = document.createElement("div");
                applicantRow.className = "applicant-row";

                const applicantName = document.createElement("span");
                applicantName.textContent =
                    application.freelancerId || "Unknown freelancer";

                const selectButton = document.createElement("button");
                selectButton.type = "button";
                selectButton.className = "btn-select-freelancer";
                selectButton.textContent =
                    job.selectedFreelancer === application.freelancerId
                        ? "Selected"
                        : "Select";

                if (job.selectedFreelancer === application.freelancerId) {
                    selectButton.disabled = true;
                }

                selectButton.addEventListener("click", async () => {
                    try {
                        selectButton.disabled = true;
                        selectButton.textContent = "Selecting...";

                        const response = await fetch(`${API_URL}/jobs`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                action: "select",
                                jobId: job.jobId,
                                freelancerId: application.freelancerId
                            })
                        });

                        const result = await response.json();

                        if (!response.ok) {
                            throw new Error(
                                result.message || "Failed to select freelancer"
                            );
                        }

                        // Remember the selected job for blockchain escrow
                          localStorage.setItem(
                          "escrowActiveJob",
                          JSON.stringify({
                              jobId: job.jobId,
                              title: job.title,
                              budget: job.budget,
                              deadline: job.deadline,
                              clientId: job.clientId,
                              freelancerId: application.freelancerId,
                              blockchainJobId: job.blockchainJobId || null,
                              blockchainFunded: job.blockchainFunded || false
                          })
                      );

                        alert("Freelancer selected successfully!");

                        await loadJobsFromAPI();
                    } catch (error) {
                        console.error(
                            "Error selecting freelancer:",
                            error
                        );

                        selectButton.disabled = false;
                        selectButton.textContent = "Select";

                        alert("Unable to select freelancer.");
                    }
                });

                applicantRow.appendChild(applicantName);
                applicantRow.appendChild(selectButton);
                applicationsBox.appendChild(applicantRow);
            });

            card.appendChild(applicationsBox);
        }

        browseJobList.appendChild(card);
      });

    } catch (error) {
      console.error("Error loading jobs:", error);
      alert("Unable to load jobs from the cloud.");
    }
  }

  function searchJobs(searchTerm) {
    const jobs = browseJobList.querySelectorAll(".browse-job-card");

    const term = searchTerm.toLowerCase().trim();

    jobs.forEach((job) => {
      const jobText = job.textContent.toLowerCase();

      if (jobText.includes(term)) {
        job.style.display = "";
      } else {
        job.style.display = "none";
      }
    });
  }

  // Browse jobs search
  browseSearch.addEventListener("input", () => {
    searchJobs(browseSearch.value);
  });

  // ==========================================
  // 4. HEADER SEARCH
  // ==========================================

  const headerSearchForm = document.getElementById("header-search-form");
  const headerSearch = document.getElementById("header-search");

  headerSearchForm.addEventListener("submit", (event) => {
    event.preventDefault();

    browseSearch.value = headerSearch.value;

    searchJobs(headerSearch.value);

    document.getElementById("browse-jobs").scrollIntoView({
      behavior: "smooth",
    });
  });

  // ==========================================
  // 5. HERO SEARCH
  // ==========================================

  const heroSearchForm = document.getElementById("hero-search-form");
  const heroSearch = document.getElementById("hero-search");

  heroSearchForm.addEventListener("submit", (event) => {
    event.preventDefault();

    browseSearch.value = heroSearch.value;

    searchJobs(heroSearch.value);

    document.getElementById("browse-jobs").scrollIntoView({
      behavior: "smooth",
    });
  });

  // ==========================================
  // 6. JOB FILTERS
  // ==========================================

  const filterForm = document.getElementById("job-filter-form");

  filterForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const category = document
      .getElementById("filter-category")
      .value.toLowerCase();

    const budget = document.getElementById("filter-budget").value;

    const jobType = document
      .getElementById("filter-job-type")
      .value.toLowerCase();

    const jobs = document.querySelectorAll(".browse-job-card");

    jobs.forEach((job) => {
      const text = job.textContent.toLowerCase();

      let matchesCategory = true;
      let matchesBudget = true;
      let matchesJobType = true;

      // Category filter
      if (category) {
        matchesCategory = text.includes(category);
      }

      // Job type filter
      if (jobType) {
        matchesJobType = text.includes(jobType);
      }

      // Budget filter
      if (budget) {
        const budgetMatch = text.match(/(\d+(\.\d+)?)\s*eth/i);

        if (budgetMatch) {
          const jobBudget = parseFloat(budgetMatch[1]);

          if (budget === "0-0.1") {
            matchesBudget = jobBudget <= 0.1;
          }

          if (budget === "0.1-0.3") {
            matchesBudget = jobBudget > 0.1 && jobBudget <= 0.3;
          }

          if (budget === "0.3-1") {
            matchesBudget = jobBudget > 0.3 && jobBudget < 1;
          }

          if (budget === "1+") {
            matchesBudget = jobBudget >= 1;
          }
        } else {
          matchesBudget = false;
        }
      }

      job.style.display =
        matchesCategory && matchesBudget && matchesJobType ? "" : "none";
    });
  });

  // ==========================================
// 7. APPLY BUTTONS
// ==========================================

browseJobList.addEventListener("click", async (event) => {
    const button = event.target.closest(".btn-apply-job");

    if (!button) {
        return;
    }

    const card = button.closest(".browse-job-card");

    if (!card) {
        return;
    }

    const jobId = card.dataset.jobId || card.id;

    if (!connectedWallet) {
    alert("Please connect your MetaMask wallet before applying.");
    return;
    }

    try {
        button.disabled = true;
        button.textContent = "Applying...";

        const response = await fetch(`${API_URL}/jobs`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                action: "apply",
                jobId: jobId,
                freelancerId: connectedWallet            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Failed to apply");
        }

        button.textContent = "Applied";
        button.dataset.applied = "true";
        button.style.opacity = "0.7";

        alert("Application submitted successfully!");
    } catch (error) {
        console.error("Error applying for job:", error);

        button.disabled = false;
        button.textContent = "Apply";

        alert("Unable to submit application.");
    }
});

  // ==========================================
  // 8. POST JOB FORM
  // ==========================================

  const postJobForm = document.getElementById("post-job-form");

    postJobForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const title = document.getElementById("job-title").value.trim();

    const description =
      document.getElementById("job-description").value.trim();

    const skills =
      document.getElementById("job-skills").value.trim();

    const category =
      document.getElementById("job-category").value;

    const budget =
      document.getElementById("job-budget").value;

    const deadline =
      document.getElementById("job-deadline").value;

    if (
      !title ||
      !description ||
      !skills ||
      !category ||
      !budget ||
      !deadline
    ) {
      alert("Please complete all required fields.");
      return;
    }

    if (!connectedWallet) {
    alert("Please connect your MetaMask wallet before posting a job.");
    return;
    }

    try {
      const response = await fetch(`${API_URL}/jobs`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          title: title,
          description: description,
          skills: skills,
          category: category,
          budget: Number(budget),
          jobType: "One-time",
          deadline: deadline,
          clientId: connectedWallet        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to create job"
        );
      }

      alert(
        `Job created successfully!\n\n` +
        `Title: ${result.title}\n` +
        `Category: ${result.category}\n` +
        `Budget: ${result.budget} ETH`
      );

      postJobForm.reset();

      // Reload jobs from AWS
      await loadJobsFromAPI();

    } catch (error) {
      console.error("Error creating job:", error);

      alert(
        "Unable to create the job. Please try again."
      );
    }
  });

 // ==========================================
// 9. ESCROW BUTTONS
// ==========================================

const fundButton = document.getElementById("btn-fund-escrow");
const acceptButton = document.getElementById("btn-accept-job");

// ==========================================
// BLOCKCHAIN CONTRACT CONNECTION
// ==========================================

const CONTRACT_ADDRESS =
    "0x878DCED9352eC87354e34F4cB15e562458450673";

const CONTRACT_ABI = [
    "function owner() view returns (address)",
    "function jobCount() view returns (uint256)",
    "function getBalance() view returns (uint256)",

    "function createJob(string title, uint256 budget, uint256 deadline) returns (uint256)",
    "function selectFreelancer(uint256 jobId, address freelancer)",
    "function fundJob(uint256 jobId) payable",
    "function acceptJob(uint256 jobId)",
    "function submitWork(uint256 jobId)",
    "function approvePayment(uint256 jobId)",
    "function raiseDispute(uint256 jobId)",
    "function voteOnDispute(uint256 jobId, uint8 vote)",
    "function resolveDispute(uint256 jobId)",
    "function clientVotes(uint256) view returns (uint256)",
    "function freelancerVotes(uint256) view returns (uint256)",
    "function isJuryMember(address) view returns (bool)",
    "function juryCount() view returns (uint256)",
    "function getJob(uint256 jobId) view returns (uint256,address,address,uint256,uint256,string,uint8)"
    ];

let contract = null;
let blockchainProvider = null;
let blockchainSigner = null;

async function getContract() {
    if (!window.ethereum) {
        throw new Error("MetaMask is not installed.");
    }

    blockchainProvider = new ethers.BrowserProvider(window.ethereum);
    blockchainSigner = await blockchainProvider.getSigner();

    contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        blockchainSigner
    );

    return contract;
}

async function getContractWithSigner() {
    if (!window.ethereum) {
        throw new Error("MetaMask is not installed.");
    }

    blockchainProvider = new ethers.BrowserProvider(window.ethereum);
    blockchainSigner = await blockchainProvider.getSigner();

    contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        blockchainSigner
    );

    return contract;
}

// Test blockchain connection
async function testContractConnection() {
    try {
        const connectedContract = await getContract();

        const ownerAddress = await connectedContract.owner();

        console.log("Smart contract connected successfully.");
        console.log("Contract owner:", ownerAddress);

    } catch (error) {
        console.error("Smart contract connection failed:", error);
    }
}

testContractConnection();

const submitButton = document.getElementById("btn-submit-work");

const approveButton = document.getElementById("btn-approve-payment");

const disputeButton = document.getElementById("btn-raise-dispute");

const fundingStatus = document.getElementById("escrow-funding-status");

const submissionStatus = document.getElementById("escrow-submission-status");

const approvalStatus = document.getElementById("escrow-approval-status");

const transactionStatus = document.getElementById("escrow-tx-status");


// ==========================================
// FUND ESCROW
// ==========================================

fundButton.addEventListener("click", async () => {
  try {
    if (!connectedWallet) {
      alert("Please connect your MetaMask wallet first.");
      return;
    }

    const savedJob = localStorage.getItem("escrowActiveJob");

    if (!savedJob) {
      alert("Please select a freelancer for a job first.");
      return;
    }

    const activeJob = JSON.parse(savedJob);

    if (
      !activeJob.clientId ||
      activeJob.clientId.toLowerCase() !== connectedWallet.toLowerCase()
    ) {
      alert("Only the job client can fund this escrow.");
      return;
    }

    if (!ethers.isAddress(activeJob.freelancerId)) {
      alert("The selected freelancer wallet address is invalid.");
      return;
    }

    if (!activeJob.budget || Number(activeJob.budget) <= 0) {
      alert("Invalid job budget.");
      return;
    }

    if (!activeJob.deadline) {
      alert("Job deadline is missing.");
      return;
    }

    const deadlineTimestamp = Math.floor(
      new Date(`${activeJob.deadline}T23:59:59`).getTime() / 1000
    );

    if (
      !Number.isFinite(deadlineTimestamp) ||
      deadlineTimestamp <= Math.floor(Date.now() / 1000)
    ) {
      alert("The job deadline must be in the future.");
      return;
    }

    const connectedContract = await getContractWithSigner();

    const budgetWei = ethers.parseEther(String(activeJob.budget));

    transactionStatus.innerHTML =
      "Creating blockchain job · confirm transaction in MetaMask...";

    // Get the current blockchain job counter
    const currentJobCount = await connectedContract.jobCount();

    // The next created job will use the next ID
    const blockchainJobId = currentJobCount + 1n;

    // 1. Create job on blockchain
    const createTx = await connectedContract.createJob(
      activeJob.title,
      budgetWei,
      deadlineTimestamp
    );

    await createTx.wait();

    transactionStatus.innerHTML =
      "Blockchain job created · selecting freelancer...";

    // 2. Select freelancer on-chain
    const selectTx = await connectedContract.selectFreelancer(
      blockchainJobId,
      activeJob.freelancerId
    );

    await selectTx.wait();

    transactionStatus.innerHTML =
      "Freelancer selected on-chain · funding escrow...";

    // 3. Fund escrow
    const fundTx = await connectedContract.fundJob(
      blockchainJobId,
      {
        value: budgetWei
      }
    );

    fundingStatus.textContent = "Funding pending...";

    await fundTx.wait();

      // Save blockchain job ID to AWS
      const blockchainSaveResponse = await fetch(`${API_URL}/jobs`, {
          method: "POST",
          headers: {
              "Content-Type": "application/json"
          },
          body: JSON.stringify({
              action: "setBlockchainJob",
              jobId: activeJob.jobId,
              blockchainJobId: blockchainJobId.toString()
          })
      });

      const blockchainSaveResult = await blockchainSaveResponse.json();

      if (!blockchainSaveResponse.ok) {
          throw new Error(
              blockchainSaveResult.message ||
              "Failed to save blockchain job ID"
          );
      }

      // Save blockchain job ID locally too
      activeJob.blockchainJobId = blockchainJobId.toString();
      activeJob.blockchainFunded = true;

      localStorage.setItem(
          "escrowActiveJob",
          JSON.stringify(activeJob)
      );

    fundingStatus.textContent = "Funded";

    transactionStatus.innerHTML =
      `Last tx: Fund escrow · ${fundTx.hash}`;

    alert(
      "Escrow funded successfully!\n\n" +
      `Blockchain Job ID: ${blockchainJobId}\n` +
      `Budget: ${activeJob.budget} ETH\n` +
      `Freelancer: ${activeJob.freelancerId}`
    );

    console.log("Blockchain job ID:", blockchainJobId.toString());
    console.log("Fund transaction:", fundTx.hash);

  } catch (error) {
    console.error("Escrow funding failed:", error);

    fundingStatus.textContent = "Not funded";

    transactionStatus.innerHTML =
      "Fund escrow failed.";

    alert(
      "Unable to fund escrow.\n\n" +
      (error.reason || error.shortMessage || error.message)
    );
  }
});


// ==========================================
// ACCEPT JOB
// ==========================================

acceptButton.addEventListener("click", async () => {
  try {
    if (!connectedWallet) {
      alert("Please connect your MetaMask wallet first.");
      return;
    }

    const savedJob = localStorage.getItem("escrowActiveJob");
    let activeJob = savedJob ? JSON.parse(savedJob) : null;

    // If blockchain ID is not in localStorage, get it from AWS
    if (!activeJob || !activeJob.blockchainJobId) {
        const jobsResponse = await fetch(`${API_URL}/jobs`);
        const jobs = await jobsResponse.json();

        const cloudJob = jobs.find(
            job =>
                job.jobId === activeJob?.jobId &&
                job.blockchainJobId
        );

    if (!cloudJob) {
        alert("Blockchain job is not funded yet.");
        return;
    }

    activeJob = {
        ...cloudJob,
        freelancerId:
            cloudJob.selectedFreelancer ||
            activeJob?.freelancerId
    };

    localStorage.setItem(
        "escrowActiveJob",
        JSON.stringify(activeJob)
    );
    }

    if (!activeJob.blockchainJobId) {
        alert("Blockchain Job ID is missing.");
        return;
    }

    if (
      !activeJob.freelancerId ||
      activeJob.freelancerId.toLowerCase() !== connectedWallet.toLowerCase()
    ) {
      alert("Only the selected freelancer can accept this job.");
      return;
    }

    if (!window.ethereum) {
      throw new Error("MetaMask is not installed.");
    }

    // Create a direct contract instance specifically for acceptJob
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const acceptContract = new ethers.Contract(
      CONTRACT_ADDRESS,
      [
        "function acceptJob(uint256 jobId)"
      ],
      signer
    );

    transactionStatus.innerHTML =
      "Accepting job · confirm transaction in MetaMask...";

    const acceptTx = await acceptContract.acceptJob(
      activeJob.blockchainJobId
    );

    await acceptTx.wait();

    activeJob.blockchainAccepted = true;

    localStorage.setItem(
      "escrowActiveJob",
      JSON.stringify(activeJob)
    );

    transactionStatus.innerHTML =
      `Last tx: Accept job · ${acceptTx.hash}`;

    alert("Job accepted successfully.");

    console.log("Accept transaction:", acceptTx.hash);

  } catch (error) {
    console.error("Accept job failed:", error);

    transactionStatus.innerHTML =
      "Accept job failed.";

    alert(
      "Unable to accept job.\n\n" +
      (error.reason || error.shortMessage || error.message)
    );
  }
});

// ==========================================
// SUBMIT WORK
// ==========================================

submitButton.addEventListener("click", async () => {
  try {
    if (!connectedWallet) {
      alert("Please connect your MetaMask wallet first.");
      return;
    }

    const savedJob = localStorage.getItem("escrowActiveJob");

    if (!savedJob) {
      alert("No active escrow job found.");
      return;
    }

    const activeJob = JSON.parse(savedJob);

    if (!activeJob.blockchainJobId) {
      alert("No blockchain job found.");
      return;
    }

    if (
      !activeJob.freelancerId ||
      activeJob.freelancerId.toLowerCase() !== connectedWallet.toLowerCase()
    ) {
      alert("Only the selected freelancer can submit the work.");
      return;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const submitContract = new ethers.Contract(
      CONTRACT_ADDRESS,
      ["function submitWork(uint256 jobId)"],
      signer
    );

    transactionStatus.innerHTML =
      "Submitting work · confirm transaction in MetaMask...";

    const submitTx = await submitContract.submitWork(
      activeJob.blockchainJobId
    );

    await submitTx.wait();

    activeJob.blockchainSubmitted = true;

    localStorage.setItem(
      "escrowActiveJob",
      JSON.stringify(activeJob)
    );

    submissionStatus.textContent = "Delivered — work submitted";

    transactionStatus.innerHTML =
      `Last tx: Submit work · ${submitTx.hash}`;

    alert("Work submitted successfully.");

  } catch (error) {
    console.error("Submit work failed:", error);

    transactionStatus.innerHTML =
      "Submit work failed.";

    alert(
      "Unable to submit work.\n\n" +
      (error.reason || error.shortMessage || error.message)
    );
  }
});


// ==========================================
// APPROVE PAYMENT
// ==========================================

approveButton.addEventListener("click", async () => {
  try {
    if (!connectedWallet) {
      alert("Please connect your MetaMask wallet first.");
      return;
    }

    const savedJob = localStorage.getItem("escrowActiveJob");

    if (!savedJob) {
      alert("No active escrow job found.");
      return;
    }

    const activeJob = JSON.parse(savedJob);

    if (!activeJob.blockchainJobId) {
      alert("No blockchain job found.");
      return;
    }

    if (
      !activeJob.clientId ||
      activeJob.clientId.toLowerCase() !== connectedWallet.toLowerCase()
    ) {
      alert("Only the client can approve the payment.");
      return;
    }

    const connectedContract = await getContractWithSigner();

    transactionStatus.innerHTML =
      "Approving payment · confirm transaction in MetaMask...";

    const approveTx = await connectedContract.approvePayment(
      activeJob.blockchainJobId
    );

    await approveTx.wait();

    activeJob.blockchainCompleted = true;

    localStorage.setItem(
      "escrowActiveJob",
      JSON.stringify(activeJob)
    );

    approvalStatus.textContent =
      "Approved — payment released";

    transactionStatus.innerHTML =
      `Last tx: Approve payment · ${approveTx.hash}`;

    alert("Payment approved and released to the freelancer.");

  } catch (error) {
    console.error("Approve payment failed:", error);

    transactionStatus.innerHTML =
      "Approve payment failed.";

    alert(
      "Unable to approve payment.\n\n" +
      (error.reason || error.shortMessage || error.message)
    );
  }
});


// ==========================================
// RAISE DISPUTE
// ==========================================

disputeButton.addEventListener("click", () => {
  document.getElementById("dispute").scrollIntoView({
    behavior: "smooth",
  });
});
  // ==========================================
  // 10. DISPUTE FORM
  // ==========================================

  const disputeForm = document.getElementById("raise-dispute-form");

  const disputeReason = document.getElementById("dispute-reason");

  const disputeStatus = document.getElementById("dispute-status");

  const juryStatus = document.getElementById("jury-status");

  disputeForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    if (!connectedWallet) {
      alert("Please connect your MetaMask wallet first.");
      return;
    }

    const savedJob = localStorage.getItem("escrowActiveJob");

    if (!savedJob) {
      alert("No active escrow job found.");
      return;
    }

    const activeJob = JSON.parse(savedJob);

    if (!activeJob.blockchainJobId) {
      alert("No blockchain job found.");
      return;
    }

    if (
      !activeJob.clientId ||
      !activeJob.freelancerId
    ) {
      alert("Client or freelancer information is missing.");
      return;
    }

    const wallet = connectedWallet.toLowerCase();
    const client = activeJob.clientId.toLowerCase();
    const freelancer = activeJob.freelancerId.toLowerCase();

    if (wallet !== client && wallet !== freelancer) {
      alert("Only the client or selected freelancer can raise a dispute.");
      return;
    }

    const reason = disputeReason.value.trim();

    if (!reason) {
      alert("Please describe the reason for the dispute.");
      return;
    }

    const connectedContract = await getContractWithSigner();

    transactionStatus.innerHTML =
      "Raising dispute · confirm transaction in MetaMask...";

    const disputeTx = await connectedContract.raiseDispute(
      activeJob.blockchainJobId
    );

    await disputeTx.wait();

    activeJob.blockchainDisputed = true;
    activeJob.disputeReason = reason;

    localStorage.setItem(
      "escrowActiveJob",
      JSON.stringify(activeJob)
    );

    disputeStatus.innerHTML =
      `<span class="job-state">Disputed</span>`;

    juryStatus.textContent =
      "Dispute raised — jury voting is now open.";

    transactionStatus.innerHTML =
      `Last tx: Raise dispute · ${disputeTx.hash}`;

    alert(
      "Dispute raised successfully.\n\n" +
      "The job is now under jury review."
    );

  } catch (error) {
    console.error("Raise dispute failed:", error);

    transactionStatus.innerHTML =
      "Raise dispute failed.";

    alert(
      "Unable to raise dispute.\n\n" +
      (error.reason || error.shortMessage || error.message)
    );
  }
});

// ==========================================
// 11. JURY VOTING AND DISPUTE RESOLUTION
// ==========================================

const voteClientButton = document.getElementById("btn-vote-client");
const voteFreelancerButton = document.getElementById("btn-vote-freelancer");
const resolveDisputeButton = document.getElementById("btn-resolve-dispute");
const juryVoteCount = document.getElementById("jury-vote-count");
const disputeResolution = document.getElementById("dispute-resolution");

async function getActiveDisputeJob() {
  if (!connectedWallet) {
    throw new Error("Connect your MetaMask wallet first.");
  }

  const savedJob = localStorage.getItem("escrowActiveJob");

  if (!savedJob) {
    throw new Error("No active escrow job found.");
  }

  const activeJob = JSON.parse(savedJob);

  if (activeJob.blockchainJobId == null) {
    throw new Error("The active job has no blockchain job ID.");
  }

  return activeJob;
}

async function refreshJuryVotes(contract, jobId) {
  const clientVotes = await contract.clientVotes(jobId);
  const freelancerVotes = await contract.freelancerVotes(jobId);

  juryVoteCount.textContent =
    "Votes for Client: " + clientVotes.toString() +
    " | Votes for Freelancer: " + freelancerVotes.toString();
}

async function submitJuryVote(vote, voteLabel) {
  try {
    const activeJob = await getActiveDisputeJob();
    const contract = await getContractWithSigner();

    juryStatus.textContent =
      "Submitting jury vote — confirm the transaction in MetaMask.";

    const tx = await contract.voteOnDispute(
      activeJob.blockchainJobId,
      vote
    );

    await tx.wait();

    await refreshJuryVotes(
      contract,
      activeJob.blockchainJobId
    );

    juryStatus.textContent = `${voteLabel} vote recorded successfully.`;

    document.getElementById("escrow-tx-status").textContent =
      `Last transaction: Jury vote · ${tx.hash}`;

    alert(`${voteLabel} vote recorded successfully.`);
  } catch (error) {
    console.error("Jury vote failed:", error);

    alert(
      "Unable to submit jury vote.\n\n" +
      (error.reason || error.shortMessage || error.message)
    );
  }
}

// Vote enum: None = 0, Client = 1, Freelancer = 2
voteClientButton.addEventListener("click", () => {
  submitJuryVote(1, "Client");
});

voteFreelancerButton.addEventListener("click", () => {
  submitJuryVote(2, "Freelancer");
});

resolveDisputeButton.addEventListener("click", async () => {
  try {
    const activeJob = await getActiveDisputeJob();
    const contract = await getContractWithSigner();
    const jobId = activeJob.blockchainJobId;

    await refreshJuryVotes(contract, jobId);

    juryStatus.textContent =
      "Resolving dispute — confirm the transaction in MetaMask.";

    const tx = await contract.resolveDispute(jobId);
    await tx.wait();

    const job = await contract.getJob(jobId);
    const clientVotes = await contract.clientVotes(jobId);
    const freelancerVotes = await contract.freelancerVotes(jobId);

    // JobState.Resolved = 6
    if (Number(job[6]) !== 6) {
      throw new Error(
        "The transaction confirmed, but the job is not marked Resolved."
      );
    }

    const result =
      freelancerVotes > clientVotes
        ? "Resolved: payment released to the freelancer."
        : "Resolved: escrow refunded to the client.";

    disputeResolution.textContent = result;
    disputeStatus.textContent = "Resolved";
    juryStatus.textContent = "Jury decision finalized.";

    activeJob.blockchainResolved = true;
    activeJob.disputeResolution = result;

    localStorage.setItem(
      "escrowActiveJob",
      JSON.stringify(activeJob)
    );

    document.getElementById("escrow-tx-status").textContent =
      `Last transaction: Resolve dispute · ${tx.hash}`;

    alert(result);
  } catch (error) {
    console.error("Dispute resolution failed:", error);

    alert(
      "Unable to resolve dispute.\n\n" +
      (error.reason || error.shortMessage || error.message)
    );
  }
});

// ==========================================
// 11. METAMASK WALLET CONNECTION
// ==========================================

const walletButton = document.getElementById("wallet-connect");

let connectedWallet = null;

function updateConnectedWallet(address) {
    if (!address) {
        connectedWallet = null;
        walletButton.textContent = "Connect Wallet";
        return;
    }

    connectedWallet = address;

    const shortAddress =
        address.slice(0, 6) +
        "..." +
        address.slice(-4);

    walletButton.textContent = shortAddress;

    console.log("Connected wallet:", connectedWallet);
}

async function connectWallet() {
    if (!window.ethereum) {
        alert("MetaMask is not installed.");
        return;
    }

    try {
        const accounts = await window.ethereum.request({
            method: "eth_requestAccounts"
        });

        updateConnectedWallet(accounts[0]);

    } catch (error) {
        console.error("Wallet connection failed:", error);
        alert("Unable to connect MetaMask.");
    }
}

// Connect wallet button
walletButton.addEventListener("click", connectWallet);

// Detect account changes while the page is open
window.ethereum?.on("accountsChanged", async (accounts) => {
    updateConnectedWallet(accounts[0]);

    // Reload jobs for the newly selected wallet
    await loadJobsFromAPI();
});

// Detect the currently selected account when the page loads
async function loadConnectedWallet() {
    if (!window.ethereum) {
        return;
    }

    try {
        const accounts = await window.ethereum.request({
            method: "eth_accounts"
        });

        if (accounts.length > 0) {
            updateConnectedWallet(accounts[0]);
        }
    } catch (error) {
        console.error("Unable to detect connected wallet:", error);
    }
}

loadConnectedWallet();

  // ==========================================
  // 12. EDIT PROFILE PLACEHOLDER
  // ==========================================

  const editProfileButton = document.getElementById("btn-edit-profile");

  editProfileButton.addEventListener("click", () => {
    alert("Profile editing will be connected to the cloud database later.");
  });

    // Load jobs from AWS when the page opens
  // Load jobs from AWS when the page opens

await loadConnectedWallet();
await loadJobsFromAPI();

console.log("FreelanceEscrow frontend JavaScript loaded successfully.");
});
