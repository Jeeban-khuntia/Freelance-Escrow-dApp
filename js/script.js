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

  const submitButton = document.getElementById("btn-submit-work");

  const approveButton = document.getElementById("btn-approve-payment");

  const disputeButton = document.getElementById("btn-raise-dispute");

  const fundingStatus = document.getElementById("escrow-funding-status");

  const submissionStatus = document.getElementById("escrow-submission-status");

  const approvalStatus = document.getElementById("escrow-approval-status");

  const transactionStatus = document.getElementById("escrow-tx-status");

  // Fund
  fundButton.addEventListener("click", () => {
    fundingStatus.textContent = "Funded";

    transactionStatus.innerHTML = `Last tx: Fund escrow · pending confirmation`;
  });

  // Submit work
  submitButton.addEventListener("click", () => {
    submissionStatus.textContent = "Delivered — work submitted";

    transactionStatus.innerHTML = `Last tx: Submit work · pending confirmation`;
  });

  // Approve payment
  approveButton.addEventListener("click", () => {
    approvalStatus.textContent = "Approved — payment released";

    transactionStatus.innerHTML = `Last tx: Approve payment · pending confirmation`;
  });

  // Raise dispute
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

  disputeForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const reason = disputeReason.value.trim();

    if (!reason) {
      alert("Please describe the reason for the dispute.");
      return;
    }

    disputeStatus.innerHTML = `<span class="job-state">Disputed</span>`;

    juryStatus.textContent =
      "Jury Voting — authorized members assigned; votes pending";

    alert(
      "Dispute raised successfully.\n\n" +
        "Jury voting will be handled by the smart contract later.",
    );
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
