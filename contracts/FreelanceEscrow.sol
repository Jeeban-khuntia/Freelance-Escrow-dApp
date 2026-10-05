// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract FreelanceEscrow {
    // ==========================================
    // JOB STATES
    // ==========================================

    enum JobState {
        Created,
        Funded,
        Accepted,
        Delivered,
        Completed,
        Disputed,
        Resolved
    }

    enum Vote {
        None,
        Client,
        Freelancer
    }

    // ==========================================
    // JOB STRUCTURE
    // ==========================================

    struct Job {
        uint256 id;
        address payable client;
        address payable freelancer;
        uint256 budget;
        uint256 deadline;
        string title;
        JobState state;
        bool exists;
    }

    // ==========================================
    // CONTRACT DATA
    // ==========================================

    address public owner;

    uint256 public jobCount;

    mapping(uint256 => Job) public jobs;

    // Job -> applicants
    mapping(uint256 => address[]) private applicants;

    // Job -> freelancer -> already applied
    mapping(uint256 => mapping(address => bool)) public hasApplied;

    // ==========================================
    // JURY DATA
    // ==========================================

    mapping(address => bool) public isJuryMember;
    uint256 public juryCount;

    // Job -> jury member -> vote
    mapping(uint256 => mapping(address => Vote)) public juryVotes;

    // Job -> vote counts
    mapping(uint256 => uint256) public clientVotes;
    mapping(uint256 => uint256) public freelancerVotes;

    // ==========================================
    // REENTRANCY PROTECTION
    // ==========================================

    bool private locked;

    // ==========================================
    // EVENTS
    // ==========================================

    event JobCreated(
        uint256 indexed jobId,
        address indexed client,
        uint256 budget,
        string title
    );

    event JobApplied(
        uint256 indexed jobId,
        address indexed freelancer
    );

    event FreelancerSelected(
        uint256 indexed jobId,
        address indexed freelancer
    );

    event JobFunded(
        uint256 indexed jobId,
        uint256 amount
    );

    event JobAccepted(
        uint256 indexed jobId
    );

    event WorkSubmitted(
        uint256 indexed jobId
    );

    event PaymentReleased(
        uint256 indexed jobId,
        address indexed freelancer,
        uint256 amount
    );

    event DisputeRaised(
        uint256 indexed jobId,
        address indexed raisedBy
    );

    event JuryVoteCast(
        uint256 indexed jobId,
        address indexed juryMember,
        Vote vote
    );

    event DisputeResolved(
        uint256 indexed jobId,
        bool freelancerWon,
        uint256 amount
    );

    // ==========================================
    // CONSTRUCTOR
    // ==========================================

    constructor() {
        owner = msg.sender;
    }

    // ==========================================
    // MODIFIERS
    // ==========================================

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    modifier jobExists(uint256 jobId) {
        require(jobs[jobId].exists, "Job does not exist");
        _;
    }

    modifier onlyClient(uint256 jobId) {
        require(
            msg.sender == jobs[jobId].client,
            "Only client can perform this action"
        );
        _;
    }

    modifier onlyFreelancer(uint256 jobId) {
        require(
            msg.sender == jobs[jobId].freelancer,
            "Only selected freelancer can perform this action"
        );
        _;
    }

    modifier nonReentrant() {
        require(!locked, "Reentrant call");
        locked = true;
        _;
        locked = false;
    }

    // ==========================================
    // JURY MANAGEMENT
    // ==========================================

    function addJuryMember(address member) external onlyOwner {
        require(member != address(0), "Invalid jury address");
        require(!isJuryMember[member], "Already a jury member");

        isJuryMember[member] = true;
        juryCount++;
    }

    function removeJuryMember(address member) external onlyOwner {
        require(isJuryMember[member], "Not a jury member");

        isJuryMember[member] = false;
        juryCount--;
    }

    // ==========================================
    // CREATE JOB
    // ==========================================

    function createJob(
        string calldata title,
        uint256 budget,
        uint256 deadline
    ) external returns (uint256) {
        require(bytes(title).length > 0, "Title required");
        require(budget > 0, "Budget must be greater than zero");
        require(deadline > block.timestamp, "Deadline must be in future");

        jobCount++;

        jobs[jobCount] = Job({
            id: jobCount,
            client: payable(msg.sender),
            freelancer: payable(address(0)),
            budget: budget,
            deadline: deadline,
            title: title,
            state: JobState.Created,
            exists: true
        });

        emit JobCreated(
            jobCount,
            msg.sender,
            budget,
            title
        );

        return jobCount;
    }

    // ==========================================
    // APPLY FOR JOB
    // ==========================================

    function applyForJob(
        uint256 jobId
    ) external jobExists(jobId) {
        Job storage job = jobs[jobId];

        require(job.state == JobState.Created, "Job is not open");
        require(msg.sender != job.client, "Client cannot apply");
        require(job.freelancer == address(0), "Freelancer already selected");
        require(
            block.timestamp <= job.deadline,
            "Application deadline passed"
        );
        require(
            !hasApplied[jobId][msg.sender],
            "Already applied"
        );

        hasApplied[jobId][msg.sender] = true;
        applicants[jobId].push(msg.sender);

        emit JobApplied(jobId, msg.sender);
    }

    // ==========================================
    // GET APPLICANTS
    // ==========================================

    function getApplicants(
        uint256 jobId
    )
        external
        view
        jobExists(jobId)
        returns (address[] memory)
    {
        return applicants[jobId];
    }

    // ==========================================
    // SELECT FREELANCER
    // ==========================================

    function selectFreelancer(
        uint256 jobId,
        address freelancer
    )
        external
        jobExists(jobId)
        onlyClient(jobId)
    {
        Job storage job = jobs[jobId];

        require(job.state == JobState.Created, "Job is not open");
        require(
            hasApplied[jobId][freelancer],
            "Address has not applied"
        );
        require(
            freelancer != address(0),
            "Invalid freelancer"
        );
        require(
            job.freelancer == address(0),
            "Freelancer already selected"
        );

        job.freelancer = payable(freelancer);

        emit FreelancerSelected(jobId, freelancer);
    }

    // ==========================================
    // FUND ESCROW
    // ==========================================

    function fundJob(
        uint256 jobId
    )
        external
        payable
        jobExists(jobId)
        onlyClient(jobId)
    {
        Job storage job = jobs[jobId];

        require(job.state == JobState.Created, "Invalid job state");
        require(
            job.freelancer != address(0),
            "Select freelancer first"
        );
        require(
            msg.value == job.budget,
            "Incorrect ETH amount"
        );

        job.state = JobState.Funded;

        emit JobFunded(jobId, msg.value);
    }

    // ==========================================
    // FREELANCER ACCEPTS
    // ==========================================

    function acceptJob(
        uint256 jobId
    )
        external
        jobExists(jobId)
        onlyFreelancer(jobId)
    {
        Job storage job = jobs[jobId];

        require(
            job.state == JobState.Funded,
            "Job is not funded"
        );

        job.state = JobState.Accepted;

        emit JobAccepted(jobId);
    }

    // ==========================================
    // SUBMIT WORK
    // ==========================================

    function submitWork(
        uint256 jobId
    )
        external
        jobExists(jobId)
        onlyFreelancer(jobId)
    {
        Job storage job = jobs[jobId];

        require(
            job.state == JobState.Accepted,
            "Job is not accepted"
        );

        job.state = JobState.Delivered;

        emit WorkSubmitted(jobId);
    }

    // ==========================================
    // APPROVE PAYMENT
    // ==========================================

    function approvePayment(
        uint256 jobId
    )
        external
        jobExists(jobId)
        onlyClient(jobId)
        nonReentrant
    {
        Job storage job = jobs[jobId];

        require(
            job.state == JobState.Delivered,
            "Work is not delivered"
        );

        uint256 amount = job.budget;

        job.state = JobState.Completed;

        (bool success, ) = job.freelancer.call{value: amount}("");

        require(success, "Payment transfer failed");

        emit PaymentReleased(
            jobId,
            job.freelancer,
            amount
        );
    }

    // ==========================================
    // RAISE DISPUTE
    // ==========================================

    function raiseDispute(
        uint256 jobId
    )
        external
        jobExists(jobId)
    {
        Job storage job = jobs[jobId];

        require(
            msg.sender == job.client ||
            msg.sender == job.freelancer,
            "Not authorized"
        );

        require(
            job.state == JobState.Funded ||
            job.state == JobState.Accepted ||
            job.state == JobState.Delivered,
            "Cannot dispute at this stage"
        );

        job.state = JobState.Disputed;

        emit DisputeRaised(jobId, msg.sender);
    }

    // ==========================================
    // JURY VOTE
    // ==========================================

    function voteOnDispute(
        uint256 jobId,
        Vote vote
    )
        external
        jobExists(jobId)
    {
        Job storage job = jobs[jobId];

        require(
            job.state == JobState.Disputed,
            "Job is not disputed"
        );

        require(
            isJuryMember[msg.sender],
            "Not an authorized jury member"
        );

        require(
            vote == Vote.Client ||
            vote == Vote.Freelancer,
            "Invalid vote"
        );

        require(
            juryVotes[jobId][msg.sender] == Vote.None,
            "Already voted"
        );

        juryVotes[jobId][msg.sender] = vote;

        if (vote == Vote.Client) {
            clientVotes[jobId]++;
        } else {
            freelancerVotes[jobId]++;
        }

        emit JuryVoteCast(
            jobId,
            msg.sender,
            vote
        );
    }

    // ==========================================
    // RESOLVE DISPUTE
    // ==========================================

    function resolveDispute(
        uint256 jobId
    )
        external
        jobExists(jobId)
        nonReentrant
    {
        Job storage job = jobs[jobId];

        require(
            job.state == JobState.Disputed,
            "Job is not disputed"
        );

        require(
            juryCount > 0,
            "No jury members configured"
        );

        uint256 totalVotes =
            clientVotes[jobId] +
            freelancerVotes[jobId];

        uint256 majority =
            (juryCount / 2) + 1;

        require(
            totalVotes >= majority,
            "Majority not reached"
        );

        uint256 amount = job.budget;

        bool freelancerWon =
            freelancerVotes[jobId] > clientVotes[jobId];

        job.state = JobState.Resolved;

        address payable recipient;

        if (freelancerWon) {
            recipient = job.freelancer;
        } else {
            recipient = job.client;
        }

        (bool success, ) = recipient.call{value: amount}("");

        require(
            success,
            "Settlement transfer failed"
        );

        emit DisputeResolved(
            jobId,
            freelancerWon,
            amount
        );
    }

    // ==========================================
    // READ JOB
    // ==========================================

    function getJob(
        uint256 jobId
    )
        external
        view
        jobExists(jobId)
        returns (
            uint256 id,
            address client,
            address freelancer,
            uint256 budget,
            uint256 deadline,
            string memory title,
            JobState state
        )
    {
        Job memory job = jobs[jobId];

        return (
            job.id,
            job.client,
            job.freelancer,
            job.budget,
            job.deadline,
            job.title,
            job.state
        );
    }

    // ==========================================
    // CONTRACT BALANCE
    // ==========================================

    function getBalance()
        external
        view
        returns (uint256)
    {
        return address(this).balance;
    }
}