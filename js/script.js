// ============================================
// FreelanceEscrow - Frontend JavaScript
// ============================================

document.addEventListener("DOMContentLoaded", () => {
  // ==========================================
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

   // Event delegation keeps Apply working for AWS-loaded jobs.
  browseJobList.addEventListener("click", (event) => {
    const button = event.target.closest(".btn-apply-job");

    if (!button) {
      return;
    }

    if (button.dataset.applied === "true") {
      return;
    }

    button.dataset.applied = "true";
    button.textContent = "Applied";
    button.disabled = true;
    button.style.opacity = "0.7";
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
          clientId: "demo-client"
        })
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
  // 11. WALLET PLACEHOLDER
  // ==========================================

  const walletButton = document.getElementById("wallet-connect");

  walletButton.addEventListener("click", () => {
    alert(
      "MetaMask wallet connection will be implemented in the next blockchain integration step.",
    );
  });

  // ==========================================
  // 12. EDIT PROFILE PLACEHOLDER
  // ==========================================

  const editProfileButton = document.getElementById("btn-edit-profile");

  editProfileButton.addEventListener("click", () => {
    alert("Profile editing will be connected to the cloud database later.");
  });

    // Load jobs from AWS when the page opens
  loadJobsFromAPI();
  console.log("FreelanceEscrow frontend JavaScript loaded successfully.");
});
