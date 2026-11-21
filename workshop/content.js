/* Workshop deck content. Each entry is one idea, one beat.
   Keep every claim defensible; no invented metrics. */

window.SLIDES = [
  {
    id: "title",
    kicker: "SUPCOM · DevOps workshop",
    title: "From commit<br>to production",
    lede: "What actually happens between “it works on my machine” and a running system — and why the gap is where engineering careers are made.",
    note: "← → to navigate · click a node in the pipeline to jump to it",
    node: null,
    kind: "title"
  },
  {
    id: "why",
    kicker: "01 · Why now",
    title: "Deployment stopped being<br>an event",
    lede: "It became a rate. The companies that win are not the ones with the best code — they are the ones that can change it safely, on a Tuesday afternoon, without a meeting.",
    facts: [
      ["83%", "of teams run CI/CD pipelines — the most adopted DevOps practice, ahead of containers and IaC"],
      ["47%", "use GitHub Actions; 32% GitLab CI; 28% Jenkins — most companies run more than one"],
      ["73%", "self-host their primary CI/CD, on-prem or self-managed. This is not a cloud-only world"]
    ],
    source: "JetBrains State of CI/CD 2026",
    node: null
  },
  {
    id: "wall",
    kicker: "02 · The problem",
    title: "Two teams,<br>one handoff",
    lede: "Developers are rewarded for change. Operations are rewarded for stability. Put a wall between them and you get a weekly argument instead of a weekly release.",
    diagram: "wall",
    points: [
      "Dev: “it works, ship it.” Ops: “we get paged at 3am when it doesn’t.”",
      "The handoff is a document. Documents do not run tests.",
      "DevOps is not a team you hire. It is a property of how the two sides work together."
    ],
    node: null
  },
  {
    id: "loop",
    kicker: "03 · The lifecycle",
    title: "It is a loop,<br>not a phase",
    lede: "Plan → code → build → test → release → deploy → operate → monitor → back to plan. Every practice below lives on this loop, and every tool is just a way to shorten one leg of it.",
    loop: true,
    node: null
  },
  {
    id: "architecture",
    kicker: "04 · The system",
    title: "One commit,<br>nine stages",
    lede: "This is the pipeline behind the project you are about to see. Everything after this slide zooms into one node of this picture.",
    architecture: true,
    node: null
  },
  {
    id: "source",
    kicker: "05 · Source",
    title: "Small changes,<br>merged often",
    lede: "Every other practice depends on this one. Big branches hide risk; small merges expose it early, when it is cheap.",
    points: [
      "Trunk-based: short-lived branches, frequent merges",
      "A pull request is a review gate, not a ceremony",
      "Conventional commits + SemVer turn history into a changelog"
    ],
    tool: "git · GitHub",
    lesson: "Before you learn any tool: learn to review and to be reviewed.",
    node: 0
  },
  {
    id: "ci",
    kicker: "06 · Continuous integration",
    title: "Prove it still<br>works, automatically",
    lede: "CI answers one question on every change: does this break anything? If a human has to answer that, it will not happen on a Friday.",
    points: [
      "Compile, unit tests, integration tests, lint, type check",
      "Path filters: a frontend change must not rebuild the backend",
      "Fail fast, fail loudly, and upload the reports when it fails"
    ],
    tool: "GitHub Actions · Maven · Failsafe",
    lesson: "A pipeline that takes 40 minutes gets bypassed. Optimise for feedback speed.",
    node: 1
  },
  {
    id: "package",
    kicker: "07 · Package",
    title: "Build once,<br>run anywhere",
    lede: "The artefact is the unit of truth. If you rebuild it for each environment, you no longer know what you tested.",
    points: [
      "Multi-stage builds: the compiler never reaches the runtime image",
      "Layer ordering: dependencies cached, application code last",
      "Non-root user, no secrets in layers, a healthcheck that lies never"
    ],
    tool: "Docker · multi-stage · layered JAR",
    lesson: "“Works in staging” is meaningless if production runs a different binary.",
    node: 2
  },
  {
    id: "security",
    kicker: "08 · Security",
    title: "Scan the thing<br>you are about to ship",
    lede: "Not the repository, not the lockfile — the image. That is the only artefact that actually runs.",
    points: [
      "Known CVEs in OS packages and libraries, with fix versions",
      "Report everything, gate on the severity you can act on",
      "Accepted risk is written down with a date and a reason — never silently ignored"
    ],
    tool: "Trivy · SBOM · Dependabot",
    lesson: "A gate that nobody can satisfy trains the team to disable the gate.",
    node: 3
  },
  {
    id: "registry",
    kicker: "09 · Release",
    title: "Versioned,<br>immutable, traceable",
    lede: "A tag is a promise that you can get back to exactly this code. `latest` is not a version; it is a guess.",
    points: [
      "Tag with the commit SHA; add a human version when you release",
      "One artefact promoted through environments, never rebuilt",
      "The registry is the handoff point between CI and the runtime"
    ],
    tool: "GHCR · SHA tags · digests",
    lesson: "Rollback is a feature. If you cannot name the previous version, you do not have one.",
    node: 4
  },
  {
    id: "iac",
    kicker: "10 · Infrastructure",
    title: "Servers as<br>source code",
    lede: "Clicking in a console produces a system nobody can rebuild. Terraform produces a plan you can review before it happens.",
    points: [
      "Plan shows the diff before it touches anything",
      "State is the map: keep it remote, locked, versioned",
      "Two commands define the discipline: apply, and destroy"
    ],
    tool: "Terraform · remote state · OIDC",
    lesson: "If rebuilding your infrastructure needs a wiki page, it is not infrastructure as code.",
    node: 5
  },
  {
    id: "kubernetes",
    kicker: "11 · Orchestration",
    title: "Describe the state,<br>let it converge",
    lede: "You stop starting containers and start declaring what should exist. The cluster’s job is to make reality match.",
    points: [
      "Probes are contracts: liveness restarts, readiness stops traffic",
      "Resources and limits decide whether your JVM survives",
      "Rolling update, then rollback — rehearsed, not improvised"
    ],
    tool: "Kubernetes · Helm · HPA",
    lesson: "Most “Kubernetes is hard” stories are a missing readiness probe or a wrong memory limit.",
    node: 6
  },
  {
    id: "observability",
    kicker: "12 · Observability",
    title: "Know it is broken<br>before a user tells you",
    lede: "Metrics tell you something is wrong, logs tell you where, traces tell you which hop. SLOs tell you whether it matters.",
    points: [
      "RED: rate, errors, duration — the first three panels of any dashboard",
      "Business metrics beat infrastructure metrics: tickets created, not CPU",
      "Alerts fire on symptoms users feel, not on every spike"
    ],
    tool: "Prometheus · Grafana · Loki · SLOs",
    lesson: "An alert nobody acts on is noise you are paying for.",
    node: 7
  },
  {
    id: "gitops",
    kicker: "13 · GitOps",
    title: "Git is the<br>desired state",
    lede: "The cluster continuously compares itself to a repository. A manual change is drift, and drift is reverted.",
    points: [
      "Deploy by merging, not by running a script from a laptop",
      "Self-heal makes the cluster converge back to git",
      "Secrets never live in the repo: sealed or external"
    ],
    tool: "Argo CD · sync policy · drift",
    lesson: "If a change can only be applied by one person, that person is the single point of failure.",
    node: 8
  },
  {
    id: "week",
    kicker: "14 · The job",
    title: "What a DevOps engineer<br>actually does all week",
    lede: "Not “writing YAML”. The work is making change cheap and failure survivable — and then proving it with numbers.",
    columns: [
      ["Build", "Pipelines, images, environments, developer experience"],
      ["Protect", "Access, secrets, scanning, upgrades, backup drills"],
      ["Operate", "On-call rotation, incident command, runbooks"],
      ["Improve", "Postmortems, SLOs, cost, removing the toil you just found"]
    ],
    metrics: ["Deployment frequency", "Lead time for change", "Change failure rate", "Time to restore"],
    metricsNote: "The four DORA metrics. Interviewers ask which one your team was worst at, and what you did about it.",
    node: null
  },
  {
    id: "live",
    kicker: "15 · Live",
    title: "The same pipeline,<br>one real project",
    lede: "A support desk: Spring Boot, PostgreSQL, Next.js. Everything you just saw is in the repository — the images, the workflow, the scan, the contract.",
    live: true,
    node: null
  },
  {
    id: "deeper",
    kicker: "16 · Go deeper",
    title: "What to learn next,<br>in this order",
    lede: "You do not need all of it. You need one pipeline you can explain end to end, and the judgement to know what to gate on.",
    ladder: [
      ["1", "Git properly", "branch, rebase, review, revert"],
      ["2", "One CI, deeply", "GitHub Actions — then read a Jenkinsfile"],
      ["3", "Docker", "multi-stage, cache, tags, non-root"],
      ["4", "One CD model", "GitOps with Argo CD"],
      ["5", "Terraform", "plan, state, destroy"],
      ["6", "Observability", "RED metrics, one SLO, one good alert"]
    ],
    exercises: [
      "Break your own build on purpose and watch CI block the merge",
      "Add a failing test, then fix it — note the time to feedback",
      "Publish an image with a SHA tag and roll back to it"
    ],
    node: null
  },
  {
    id: "close",
    kicker: "17 · Close",
    title: "The job is not<br>the tools",
    lede: "Tools change every three years. The judgement — what to automate, what to gate, what to measure — is what compounds. Build one pipeline you understand completely, then explain it to someone else. That is how you keep it.",
    kind: "close",
    note: "Questions · then we open the repository",
    node: null
  }
];
