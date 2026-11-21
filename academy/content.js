/* Program content. One session = one workshop, told as a sequence of slides.
   Language-agnostic on purpose: "your build tool", not a specific one. */

window.PROGRAM = [
{
  id: "s0", n: "00", title: "Orientation - the whole map", duration: "60 min", level: "no prerequisites",
  short: "What DevOps actually is, the loop, the four numbers, and how this program works.",
  slides: [
    { kicker: "session 00 / slide 1", title: "DevOps is a property,<br>not a team",
      lede: "You cannot hire DevOps. You can only build a delivery system where change is cheap and failure is survivable. Everything in the next ten sessions is one stage of that system.",
      points: [["What it is not", "a job title, a tool, or a department you rename."],
                ["What it is", "the set of practices that keep the distance between a commit and a running system short and safe."],
                ["Why it matters", "companies do not compete on code volume. they compete on how fast they can change it without breaking it."]],
      viz: "abstract" },

    { kicker: "session 00 / slide 2", title: "The loop you will live in",
      lede: "Eight stages. A stage you skip does not disappear - it moves to production, at the worst possible time, with a customer watching.",
      points: [["plan -> code", "the change is designed and written."],
                ["build -> test", "the change is proven to work, automatically."],
                ["release -> deploy", "the change becomes an artefact and reaches an environment."],
                ["operate -> monitor", "the change is watched, and what you learn feeds the next plan."]],
      viz: "abstract" },

    { kicker: "session 00 / slide 3", title: "The only four numbers<br>that measure it",
      lede: "DORA's four metrics are used everywhere because they are hard to fake and easy to argue about. Learn them before you learn any tool.",
      stats: [["Deployment frequency", "how often you ship to production."],
               ["Lead time", "commit to running in production."],
               ["Change failure rate", "the share of changes that cause an incident."],
               ["Time to restore", "how long an incident lasts."]],
      quote: "In an interview nobody asks you to define them. They ask which one your team was worst at, and what you changed.",
      viz: "abstract" },

    { kicker: "session 00 / slide 4", title: "What a pipeline really is",
      lede: "A pipeline is a sequence of proofs. Each stage answers a narrower question than the last, and a failed stage means the next question does not matter yet.",
      points: [["checkout", "do we have the exact code?"], ["build", "does it compile?"],
                ["test", "does it behave?"], ["scan", "is it knowingly vulnerable?"],
                ["package", "can we name the artefact?"], ["publish", "can others get it?"]],
      viz: "pipeline" },

    { kicker: "session 00 / slide 5", title: "How this program works",
      lede: "Every session is the same shape, and every session ends with something you did, not something you heard.",
      points: [["1 concept", "a short, opinionated explanation you could redraw from memory."],
                ["2 simulation", "a 3D model you drive - you break it and watch what happens."],
                ["3 lab", "real commands against your own machine or repository."],
                ["4 checkpoint", "one sentence you must be able to say before moving on."]],
      viz: "abstract" },

    { kicker: "session 00 / slide 6", title: "What you should leave with",
      lede: "By the end of the program you will have one pipeline you can explain end to end, and the judgement to know what to gate on.",
      points: [["Not memorised commands", "those you can look up. The reason behind them you cannot."],
                ["A working loop", "on a real project you own, not a tutorial."],
                ["The vocabulary", "artefact, promotion, drift, SLO, gate - used correctly."]],
      viz: "abstract" }
  ]
},

{
  id: "s1", n: "01", title: "Git - the commit-to-production graph", duration: "75 min", level: "a terminal",
  short: "What actually happens on commit, push, PR and merge, told as a graph rather than a list of commands.",
  slides: [
    { kicker: "session 01 / slide 1", title: "Two graphs,<br>not one",
      lede: "Most people learn Git as commands. The commands are trivial; the graph is the whole point. You always have a local graph and a remote graph, and every command moves a pointer or copies nodes between them.",
      points: [["Local", "commits you created. Nobody else has them yet."],
                ["Remote", "commits the team shares. This is what CI sees on a branch."],
                ["Pointer", "a branch is just a name attached to one commit."]],
      viz: "git",
      sim: { kind: "git", title: "make a commit, then look at both lanes",
        buttons: [{ label: "git commit", action: "commit", primary: true }, { label: "reset", action: "reset" }] } },

    { kicker: "session 01 / slide 2", title: "Commit is local.<br>Always.",
      lede: "A commit creates a node in your local graph and moves your branch pointer to it. It is not a save to the server, and it is not a publish. You can commit forty times and nobody will ever know.",
      points: [["What changes", "your local branch pointer."],
                ["What does not", "the remote. It is untouched."],
                ["Why it matters", "this is why you can work offline, and why an unreviewed history is yours to rewrite."]],
      viz: "git",
      sim: { kind: "git", title: "click commit twice - watch only the local lane grow",
        buttons: [{ label: "git commit", action: "commit", primary: true }] } },

    { kicker: "session 01 / slide 3", title: "Push copies.<br>It does not overwrite.",
      lede: "Push copies your commits to the remote and moves the remote pointer forward. If the remote has moved ahead, the push is rejected - that rejection is protection, not a failure.",
      points: [["Fast-forward", "the remote is an ancestor of yours. The copy is safe."],
                ["Rejected", "someone else pushed first. You must integrate their work before yours."],
                ["Never force by reflex", "rewriting a shared branch silently deletes other people's commits."]],
      viz: "git",
      sim: { kind: "git", title: "commit twice, then push - the spheres travel to the remote lane", setup: ["commit", "commit"],
        buttons: [{ label: "git commit", action: "commit" }, { label: "git push", action: "push", primary: true }] } },

    { kicker: "session 01 / slide 4", title: "A pull request<br>is a request",
      lede: "It is not a merge. It creates a review surface and runs CI against the proposed branch before anything reaches the main line.",
      points: [["What it enables", "review, discussion, and automated checks on an isolated branch."],
                ["What it prevents", "an unreviewed change landing in the branch everyone deploys from."],
                ["The naming", "GitHub says pull request, GitLab says merge request. Same object."]],
      viz: "git",
      sim: { kind: "git", title: "open a PR - a ring appears on the remote tip", setup: ["commit", "commit", "push"],
        buttons: [{ label: "commit + push", action: "push" }, { label: "open PR", action: "pr", primary: true }] } },

    { kicker: "session 01 / slide 5", title: "Merge is the moment<br>the change exists",
      lede: "Until merge, the change is a proposal. Merge moves the shared pointer and adds a node joining the histories. This is the first instant the whole team's main line contains your work.",
      points: [["Merge commit", "keeps the branch topology, one extra node."],
                ["Squash", "one clean node on main - easier history, lost granularity."],
                ["Rebase", "linear history, rewritten commits. Fine on your branch, dangerous on shared ones."]],
      viz: "git",
      sim: { kind: "git", title: "merge - the ring turns green and main moves", setup: ["commit", "commit", "push", "pr"],
        buttons: [{ label: "open PR", action: "pr" }, { label: "merge", action: "merge", primary: true }] } },

    { kicker: "session 01 / slide 6", title: "Tags are how you<br>get back",
      lede: "A tag is a name for one commit. Release tags are the only reliable way to answer the question every incident asks first: what exactly was running?",
      points: [["Annotated tag", "carries a message, an author and a date. Use these for releases."],
                ["Tags do not move", "unlike a branch. A tag you pushed yesterday still points at the same commit."],
                ["The link to CI", "a version tag is usually what produces a versioned artefact."]],
      viz: "abstract",
      code: { label: "terminal", snippet: "git tag -a v1.4.0 -m \"release 1.4.0\"\ngit push origin v1.4.0\ngit tag --list\n\n# an incident asks: which commit is in production?\ngit describe --tags --always" } },

    { kicker: "session 01 / slide 7", title: "Lab - feel the rejection",
      lede: "Do this on a scratch repository. The goal is not to memorise commands; it is to have felt a rejected push and fixed it without panic.",
      lab: [
        { title: "Commit locally, twice", body: "Create two commits and look at the graph before and after.", cmd: "git log --oneline --graph --all", expect: "* c2  second change\n* c1  first change", checkpoint: "I can see that both commits are local only" },
        { title: "Make the remote move", body: "Edit a file directly on the remote (or a second clone) and commit there.", checkpoint: "The remote is now ahead of my local branch" },
        { title: "Push and read the rejection", body: "Try to push. Read the error instead of pasting a fix.", cmd: "git push", expect: "! [rejected] main -> main (fetch first)\nerror: failed to push some refs", checkpoint: "I can explain why the push was refused" },
        { title: "Integrate, then push", body: "Fetch, rebase on the remote, resolve, push again.", cmd: "git pull --rebase origin main\ngit push", expect: "Successfully rebased and updated refs/heads/main.", checkpoint: "I resolved a rejected push with rebase" }
      ],
      viz: "git" }
  ]
},

{
  id: "s2", n: "02", title: "Docker - image, layers, Dockerfile, Compose", duration: "120 min", level: "Docker installed",
  short: "An image is a stack of layers. Everything about build speed and security follows from that one fact.",
  slides: [
    { kicker: "session 02 / slide 1", title: "An image is<br>a stack of layers",
      lede: "Not a folder, not a VM disk. Each Dockerfile instruction produces a read-only layer, stacked in order. A container adds one thin writable layer on top, and that layer dies with the container.",
      points: [["Layer", "the result of one instruction. Immutable once created."],
                ["Container", "your image plus a writable top layer, plus a process."],
                ["Consequence", "anything written inside the container vanishes when it is removed - unless it is in a volume."]],
      viz: "docker",
      sim: { kind: "docker", title: "build the stack - seven layers appear in order",
        buttons: [{ label: "docker build", action: "build", primary: true }, { label: "reset", action: "reset" }] } },

    { kicker: "session 02 / slide 2", title: "Cache is the<br>whole game",
      lede: "Docker caches each layer keyed by the instruction and its inputs. Change one instruction and every layer after it must be rebuilt. That single rule decides your build time.",
      points: [["Rule", "put what changes rarely above what changes constantly."],
                ["Symptom of getting it wrong", "editing one source file downloads every dependency again."],
                ["Measure it", "build twice, change one file, look for CACHED in the output."]],
      viz: "docker",
      sim: { kind: "docker", title: "build, then change source - only the last layers invalidate",
        buttons: [{ label: "docker build", action: "build", primary: true }, { label: "change source", action: "change" }] } },

    { kicker: "session 02 / slide 3", title: "Multi-stage:<br>two images, one file",
      lede: "The build stage has the compiler, the dependency cache and the source. The runtime stage copies only the artefact. Your production image should not contain a package manager.",
      points: [["Build stage", "heavy, disposable, never shipped."],
                ["Runtime stage", "small, non-root, contains only what runs."],
                ["The number to remember", "ship tens of megabytes, not hundreds, and with no build tooling to exploit."]],
      viz: "docker",
      code: { label: "Dockerfile (generic)", snippet: "FROM build-image AS build\nCOPY manifest .\nRUN install-dependencies\nCOPY source .\nRUN build-artefact\n\nFROM runtime-image AS runtime\nRUN create-user app\nCOPY --from=build /out/artefact ./app\nUSER app\nENTRYPOINT [\"./app\"]" } },

    { kicker: "session 02 / slide 4", title: "One instruction,<br>one layer, one reason",
      lede: "Read a Dockerfile as a sequence of decisions. Each line either installs something, copies something, or changes who runs the process.",
      points: [["FROM", "pick a pinned base. 'latest' is not a version."],
                ["COPY + RUN pairs", "dependency manifest first, source second - that ordering is the cache."],
                ["USER", "drop root. The container does not need it and an exploit loves it."],
                ["HEALTHCHECK", "the container should be able to say whether it is alive."]],
      viz: "docker",
      sim: { kind: "docker", title: "break the dependency layer to see what a bad order costs",
        buttons: [{ label: "docker build", action: "build" }, { label: "dependency fails", action: "fail", primary: true }, { label: "reset", action: "reset" }] } },

    { kicker: "session 02 / slide 5", title: "Containers are<br>disposable. Data is not.",
      lede: "The writable layer is not storage. If a database writes into the container, a restart is a data loss event. This is the first thing that bites beginners and the last thing they forget.",
      points: [["Named volume", "Docker manages it. Survives container removal."],
                ["Bind mount", "a host directory, for local development."],
                ["The command to fear", "tearing a stack down with volumes removes the data too."]],
      viz: "docker",
      code: { label: "terminal", snippet: "# keeps the volume\ndocker compose down\n\n# deletes the volume AND the data\ndocker compose down -v\n\n# inspect what exists\ndocker volume ls" } },

    { kicker: "session 02 / slide 6", title: "Compose is ordering,<br>not packaging",
      lede: "Compose starts services. Correctness comes from health checks: a service should start only when what it depends on is ready to answer, not merely started.",
      points: [["depends_on (plain)", "waits for the container to start. Almost never enough."],
                ["condition: service_healthy", "waits for the health check to pass. This is what you want."],
                ["Why it matters", "a database accepts TCP before it accepts queries - the difference is a crash loop."]],
      viz: "compose",
      sim: { kind: "compose", title: "start the stack - health gates decide the order",
        buttons: [{ label: "docker compose up", action: "up", primary: true }, { label: "down", action: "down" }] } },

    { kicker: "session 02 / slide 7", title: "The Compose file<br>that stays honest",
      lede: "Four things make a Compose file trustworthy: explicit health checks, a real dependency condition, environment from outside the file, and a service that does not run as root.",
      points: [["Health", "a command that fails when the service is not ready."],
                ["Order", "dependency conditions, not sleeps."],
                ["Config", "environment variables, never baked values."],
                ["Ports", "publish only what you need to reach from the host."]],
      viz: "compose",
      code: { label: "docker-compose.yml (generic)", snippet: "services:\n  db:\n    image: postgres:16-alpine\n    healthcheck:\n      test: [\"CMD-SHELL\", \"pg_isready\"]\n      interval: 10s\n    volumes: [ \"db:/var/lib/postgresql/data\" ]\n\n  api:\n    build: ./api\n    environment:\n      DATABASE_URL: postgres://db:5432/app\n    depends_on:\n      db:\n        condition: service_healthy\n\nvolumes:\n  db:" } },

    { kicker: "session 02 / slide 8", title: "Lab - prove the cache<br>and lose the data",
      lede: "Two experiments. One teaches speed, the other teaches that volumes are the only persistence you have.",
      lab: [
        { title: "Measure the cache", body: "Build your image, note the time, touch a source file, build again. Find the word CACHED.", cmd: "docker build -t app:lab .\n# edit one source file\ndocker build -t app:lab .", expect: "CACHED  (for every layer before your source copy)", checkpoint: "I saw which layers stayed cached" },
        { title: "Prove the runtime user", body: "Look at the process user inside the container.", cmd: "docker run --rm --entrypoint sh app:lab -c \"id\"", expect: "uid=1000(...) gid=1000(...) - not root", checkpoint: "I confirmed the container does not run as root" },
        { title: "Lose the database", body: "Start a database, write something, down, up, check. Then down -v, up, check again.", cmd: "docker compose up -d db\ndocker compose down\ndocker compose up -d db\ndocker compose down -v\ndocker compose up -d db", expect: "data survives 'down', disappears after 'down -v'", checkpoint: "I know which command destroys my data" }
      ],
      viz: "compose" }
  ]
},

{
  id: "s3", n: "03", title: "CI - the pipeline, stage by stage", duration: "90 min", level: "a repository",
  short: "Each stage is a different kind of proof. Break one and watch the rest correctly refuse to run.",
  slides: [
    { kicker: "session 03 / slide 1", title: "CI asks exactly<br>one question",
      lede: "Did this change break anything? Everything else - scanning, packaging, publishing - is downstream of that answer. If a human has to answer it, it will not happen on a Friday.",
      points: [["Automated", "no judgement, no memory, no 'it was fine last time'."],
                ["On every change", "not nightly. The value is in the frequency."],
                ["Before merge", "so the main branch is always in a known state."]],
      viz: "pipeline",
      sim: { kind: "pipeline", title: "run the pipeline - six stages, six proofs",
        buttons: [{ label: "run", action: "run", primary: true }] } },

    { kicker: "session 03 / slide 2", title: "Order is the design",
      lede: "Cheap, fast, high-signal stages go first. A pipeline that takes forty minutes gets bypassed by humans, and a bypassed pipeline is decoration.",
      points: [["Fail fast", "checkout and compile before a ten-minute test suite."],
                ["Parallel where possible", "independent jobs should not wait for each other."],
                ["Stop on first failure", "later stages would only produce noise."]],
      viz: "pipeline",
      sim: { kind: "pipeline", title: "watch the stages light up in order",
        buttons: [{ label: "run", action: "run", primary: true }] } },

    { kicker: "session 03 / slide 3", title: "A failure must<br>stop the line",
      lede: "This is the simulation's whole purpose: a red test means the scan never runs and the artefact is never published. Nothing half-verified reaches a registry.",
      points: [["Skipped is not passed", "grey stages are not evidence of anything."],
                ["The output is the product", "upload test reports or you will rerun blind."],
                ["Fix forward, do not retry", "a retry that passes means the test is flaky - fix that too."]],
      viz: "pipeline",
      sim: { kind: "pipeline", title: "arm a failing test, then run - stages 5 and 6 never execute",
        buttons: [{ label: "arm failing test", action: "fail" }, { label: "run", action: "run", primary: true }] } },

    { kicker: "session 03 / slide 4", title: "Only build what changed",
      lede: "In a repository with two applications, a change to one should not pay for the other. Path filters are not an optimisation - they are how a monorepo stays usable.",
      points: [["Detect", "a first job decides which paths changed."],
                ["Gate", "later jobs condition on that output."],
                ["Consequence", "a web-only change skips the backend job entirely."]],
      viz: "pipeline",
      code: { label: "ci.yml (generic shape)", snippet: "jobs:\n  changes:\n    outputs:\n      api: ${{ steps.filter.outputs.api }}\n    steps:\n      - uses: dorny/paths-filter@v3\n        id: filter\n        with:\n          filters: |\n            api: ['api/**']\n            web: ['web/**']\n\n  api:\n    needs: changes\n    if: needs.changes.outputs.api == 'true'\n    steps:\n      - run: ./build.sh\n      - run: ./test.sh" } },

    { kicker: "session 03 / slide 5", title: "Gates have severities",
      lede: "Not everything should block a merge. A failing test always should. A high-severity dependency finding usually should not, because teams start disabling the scanner.",
      points: [["Blocking", "broken build, failing test, critical vulnerability with a fix available."],
                ["Advisory", "style nits, high findings with no fix, coverage drops."],
                ["The test of a good gate", "when it fires, someone knows what to do next."]],
      viz: "pipeline",
      quote: "A gate that nobody can satisfy trains the team to remove the gate.",
      quoteAttr: "what usually happens in week three" },

    { kicker: "session 03 / slide 6", title: "Lab - break it<br>and read it",
      lede: "You will break your own pipeline twice: once with a failing test, once with a path filter. Both are five-minute operations that teach more than an hour of reading.",
      lab: [
        { title: "Make a test fail", body: "On a branch, change one assertion so it is false, push, open a pull request.", cmd: "./test.sh   # locally, before pushing\n# then commit and push the branch", expect: "pipeline: red at the test stage", checkpoint: "I saw a real pipeline stop at the failing stage" },
        { title: "Read the skip", body: "Change only frontend files and open a PR. In the run log, find the filter output.", expect: "Filter api = false", checkpoint: "I explained a skipped job from the log" },
        { title: "Upload the evidence", body: "Find where test reports are stored in your pipeline and download one after a failure.", checkpoint: "I know where the failure evidence lives" }
      ],
      viz: "pipeline" }
  ]
},

{
  id: "s4", n: "04", title: "Registry - versions, digests, rollback", duration: "60 min", level: "after CI",
  short: "An artefact is a fact. A tag is a name. Confusing the two is how rollbacks fail.",
  slides: [
    { kicker: "session 04 / slide 1", title: "A digest is<br>the truth",
      lede: "Every image has a content hash. Tags are names pointing at a digest, and names can be moved. If production pins a tag someone else can rewrite, you do not know what is running.",
      points: [["Digest", "immutable, content-addressed identity."],
                ["Tag", "a pointer. 'latest' is a pointer that moves."],
                ["Pinning", "production should reference a digest, or a tag you control and never reuse."]],
      viz: "abstract" },

    { kicker: "session 04 / slide 2", title: "Name it after<br>the commit",
      lede: "A tag derived from the commit SHA makes every deployment traceable and makes rollback a lookup rather than an investigation.",
      points: [["sha-1a2b3c4", "which code is in this image, unambiguously."],
                ["latest", "a convenience for humans. Never an input to a rollback decision."],
                ["Human versions", "v1.4.0 on top, when you release."]],
      viz: "abstract",
      code: { label: "image build (generic)", snippet: "# tag with the commit, not with a feeling\nTAG=$(git rev-parse --short HEAD)\ndocker build -t registry.example.com/app:sha-$TAG .\ndocker push registry.example.com/app:sha-$TAG\n\n# two names, one digest\ndocker inspect --format='{{index .RepoDigests 0}}' \\\n  registry.example.com/app:sha-$TAG" } },

    { kicker: "session 04 / slide 3", title: "Build once,<br>promote many times",
      lede: "If staging and production build separately, they run different binaries and your staging evidence is worthless. Build one artefact and move the same digest through environments.",
      points: [["Anti-pattern", "rebuild per environment."],
                ["The rule", "the thing you tested is the thing you deploy."],
                ["Promotion", "a pointer change, not a rebuild."]],
      viz: "abstract" },

    { kicker: "session 04 / slide 4", title: "Rollback is<br>a feature",
      lede: "If you cannot name the previous version, you do not have one. Rollback should be a one-line operation you have practised, not an improvisation during an incident.",
      points: [["What you need", "the previous tag, a healthy artefact, and one command."],
                ["What you must rehearse", "doing it while it is broken."],
                ["What to record", "which version, who decided, and why."]],
      viz: "abstract" },

    { kicker: "session 04 / slide 5", title: "Lab - publish,<br>pull, roll back",
      lede: "Nothing here is theoretical. You need to see your own image leave your machine and come back as an immutable artefact.",
      lab: [
        { title: "Publish with a SHA tag", body: "Tag your built image with the commit and push it.", cmd: "TAG=$(git rev-parse --short HEAD)\ndocker tag app:lab registry.example.com/app:sha-$TAG\ndocker push registry.example.com/app:sha-$TAG", expect: "pushed", checkpoint: "I published a SHA-tagged image" },
        { title: "Delete and pull back", body: "Remove the local image and pull it again by tag.", cmd: "docker rmi registry.example.com/app:sha-$TAG\ndocker pull registry.example.com/app:sha-$TAG", expect: "Status: Downloaded newer image", checkpoint: "I restored the exact artefact from the registry" },
        { title: "Point at the previous one", body: "Change a deployment to the older SHA and confirm the old version is serving.", checkpoint: "I rolled back by changing one tag" }
      ],
      viz: "abstract" }
  ]
},

{
  id: "s5", n: "05", title: "Security - scan the artefact you ship", duration: "75 min", level: "after registry",
  short: "Scan the image, read the fix column, and decide what blocks a merge versus what is accepted in writing.",
  slides: [
    { kicker: "session 05 / slide 1", title: "You scan the image,<br>not the repository",
      lede: "The image contains OS packages your dependency file never mentions. Scanning source is necessary and insufficient.",
      points: [["Two layers of risk", "your libraries, and the base operating system."],
                ["The unit that runs", "the artefact. Scan what runs."],
                ["Frequency", "every build, because base images move under you."]],
      viz: "abstract" },

    { kicker: "session 05 / slide 2", title: "Read the fix column<br>before you panic",
      lede: "A finding with no available fix cannot be remediated by you, and blocking on it only teaches the team to disable the scanner. A finding with a fix is a task.",
      points: [["Fix available", "upgrade. This is the actionable bucket."],
                ["No fix yet", "document it, limit exposure, set a review date."],
                ["Severity is not exploitability", "a critical in code you never execute still matters for compliance - but the response differs."]],
      viz: "abstract" },

    { kicker: "session 05 / slide 3", title: "Accepted risk<br>is written down",
      lede: "Silence is not acceptance. A suppression file with a date, a reason and a review trigger is engineering. A disabled scanner is a decision nobody will remember making.",
      points: [["What to record", "identifier, why it cannot be fixed now, exposure, when to revisit."],
                ["Where", "next to the code, in version control, reviewed like code."],
                ["What it protects", "the next engineer, who will otherwise re-litigate it from scratch."]],
      viz: "abstract",
      code: { label: "accepted-risk note (generic)", snippet: "# CVE-XXXX-YYYY - package 1.2.3\n#   Fixed version 1.2.4 is not published yet upstream.\n#   Exposure: internal service, no untrusted input reaches this path.\n#   Owner: platform team. Review: 2026-03-01.\nCVE-XXXX-YYYY" } },

    { kicker: "session 05 / slide 4", title: "Secrets are not<br>configuration",
      lede: "A secret in a Dockerfile or a build argument is in the layer history forever, even if a later line deletes it. Inject at runtime, from a store you can rotate.",
      points: [["Never", "in the repository, in an image layer, in a build argument."],
                ["At runtime", "environment from a secret manager, or a mounted file."],
                ["Rotation", "if you cannot rotate it, it is not a secret - it is a liability."]],
      viz: "abstract" },

    { kicker: "session 05 / slide 5", title: "Lab - scan, judge,<br>then gate",
      lede: "Run the scanner on your own image, pick one finding, and write the decision. Then make the gate fail on purpose.",
      lab: [
        { title: "Scan and count", body: "Scan the image you built, filtering to high and critical, ignoring findings with no fix.", cmd: "trivy image --severity CRITICAL,HIGH --ignore-unfixed app:lab", expect: "Total: N (HIGH: x, CRITICAL: y)", checkpoint: "I ran a scan and read the summary" },
        { title: "Write one accepted-risk note", body: "Choose a finding with no fix. Write four lines: identifier, reason, exposure, review date.", checkpoint: "I documented one accepted risk properly" },
        { title: "Make the gate fail", body: "Run with exit-code 1 and confirm the command fails. That failure is the gate.", cmd: "trivy image --exit-code 1 --severity CRITICAL --ignore-unfixed app:lab; echo \"exit=$?\"", expect: "exit=1", checkpoint: "I made a scan fail on purpose and understood why" }
      ],
      viz: "abstract" }
  ]
},

{
  id: "s6", n: "06", title: "Terraform - infrastructure you can review", duration: "120 min", level: "a cloud or local target",
  short: "Plan is a diff. State is a map. Destroy is part of the workflow.",
  slides: [
    { kicker: "session 06 / slide 1", title: "A console produces<br>a system nobody can rebuild",
      lede: "Clicks are not reproducible, reviewable or reversible. Code is. That is the entire argument, and it is enough.",
      points: [["Reproducible", "one command from nothing to a working environment."],
                ["Reviewable", "the diff is visible before anything happens."],
                ["Reversible", "destroy is a first-class operation, not an archaeology project."]],
      viz: "abstract" },

    { kicker: "session 06 / slide 2", title: "Plan is a diff you<br>must actually read",
      lede: "Green adds, yellow changes, red destroys. Reading the plan is the discipline; applying is the easy part.",
      points: [["Why read it", "the dangerous change is almost always something you did not intend."],
                ["What to look for", "surprise destroys, changes in place that will recreate a resource."],
                ["Habit", "save the plan to a file, then apply exactly that file."]],
      viz: "abstract",
      code: { label: "terminal", snippet: "terraform init\nterraform validate\nterraform plan -out tfplan\n\n# read every line, then\ntf vars / terraform apply tfplan" } },

    { kicker: "session 06 / slide 3", title: "State is the map,<br>and maps get lost",
      lede: "State records what exists. Keep it remote, locked and versioned; otherwise two engineers will apply at once and the map will lie.",
      points: [["Remote", "shared, not on a laptop."],
                ["Locked", "one writer at a time."],
                ["Versioned", "so a corrupted state is recoverable."]],
      viz: "abstract" },

    { kicker: "session 06 / slide 4", title: "Modules are functions<br>for infrastructure",
      lede: "Network, database, compute. Each takes inputs, produces outputs, and can be tested and replaced independently.",
      points: [["Inputs", "variables with sensible defaults."],
                ["Outputs", "the ids the next module needs."],
                ["Boundary", "a module should not reach into another module's resources."]],
      viz: "abstract" },

    { kicker: "session 06 / slide 5", title: "Lab - plan, break,<br>destroy",
      lede: "Build the smallest possible environment, then deliberately break the state to see what Terraform does.",
      lab: [
        { title: "Plan before apply", body: "Write a tiny environment, plan it, and read every line before applying.", cmd: "terraform init\nterraform plan -out tfplan", expect: "Plan: 3 to add, 0 to change, 0 to destroy.", checkpoint: "I read a plan before applying it" },
        { title: "Rename a resource", body: "Rename a resource block and plan again. Explain the destroy/create.", checkpoint: "I can explain why a rename recreates a resource" },
        { title: "Destroy and verify", body: "Destroy everything and check the console for leftovers.", cmd: "terraform destroy", expect: "Destroy complete! Resources: 3 destroyed.", checkpoint: "I destroyed the environment and verified nothing remained" }
      ],
      viz: "abstract" }
  ]
},

{
  id: "s7", n: "07", title: "Kubernetes - probes, rollouts, why pods die", duration: "120 min", level: "a local cluster",
  short: "Declare the desired state. Then learn to read the four ways it can disagree with you.",
  slides: [
    { kicker: "session 07 / slide 1", title: "You stop starting<br>containers",
      lede: "You declare what should exist, and the cluster continuously converges reality to that declaration. Restarting, rescheduling and removing traffic are all the same mechanism.",
      points: [["Desired state", "a Deployment says: three copies of this image, always."],
                ["Convergence", "the cluster compares, then acts - forever."],
                ["Consequence", "a manual change is not special, it is just drift to be corrected."]],
      viz: "abstract" },

    { kicker: "session 07 / slide 2", title: "Three probes,<br>three different jobs",
      lede: "Confusing them is the most common self-inflicted outage. Each answers a different question to a different audience.",
      points: [["startup", "has it finished booting? Keeps liveness quiet while a slow app starts."],
                ["liveness", "is it stuck? Failing this restarts the container."],
                ["readiness", "can it serve traffic now? Failing this removes it from the load balancer, without killing it."]],
      viz: "abstract",
      quote: "A pod can be Running and not Ready. If you only look at Running, you will debug the wrong thing.",
      quoteAttr: "the first thing to check in an incident" },

    { kicker: "session 07 / slide 3", title: "Limits decide whether<br>your process survives",
      lede: "A memory limit is not a suggestion. Exceed it and the kernel kills the process - exit code 137 - with no exception, no stack trace and no log line.",
      points: [["Heap vs limit", "a runtime that sizes itself from the host will exceed a container limit."],
                ["The symptom", "restarts under load, nothing in the application log."],
                ["The fix", "tell the runtime about the limit, and set the limit from measurement."]],
      viz: "abstract" },

    { kicker: "session 07 / slide 4", title: "Rollouts are rehearsed,<br>not improvised",
      lede: "Every deployment in Kubernetes is a rolling update with a revision history. Rollback is one command you should have used before you needed it.",
      points: [["Rolling update", "new pods become ready before old ones leave."],
                ["History", "each rollout is a revision you can inspect."],
                ["Rollback", "go back to the previous revision without rebuilding anything."]],
      viz: "abstract",
      code: { label: "terminal", snippet: "kubectl rollout status deploy/api\nkubectl rollout history deploy/api\nkubectl rollout undo deploy/api\n\n# why is this pod not ready?\nkubectl describe pod <pod>   # look at Events, not Status" } },

    { kicker: "session 07 / slide 5", title: "Lab - the four ways<br>a pod lies to you",
      lede: "You will cause each failure and diagnose it from events only. That constraint is the lesson.",
      lab: [
        { title: "Deploy and read readiness", body: "Apply a deployment and watch until the pod is Ready, not merely Running.", cmd: "kubectl apply -f k8s/\nkubectl get pods -w", expect: "1/1 Running", checkpoint: "I can tell Running from Ready" },
        { title: "Break readiness", body: "Point the readiness probe at a wrong path. The pod stays Running and leaves the endpoints.", expect: "Running, endpoints empty", checkpoint: "I explained Running vs Ready" },
        { title: "Cause an OOM kill", body: "Set a memory limit below what the process needs and read the exit code.", cmd: "kubectl get pod <pod> -o jsonpath='{.status.containerStatuses[0].lastState.terminated.exitCode}'", expect: "137", checkpoint: "I diagnosed an OOM kill from the exit code" },
        { title: "Roll back", body: "Deploy a bad image, watch it fail, then roll back.", cmd: "kubectl rollout undo deploy/api", expect: "rolled back", checkpoint: "I performed a rollback" }
      ],
      viz: "abstract" }
  ]
},

{
  id: "s8", n: "08", title: "Observability - one good alert", duration: "90 min", level: "after Kubernetes",
  short: "Metrics say something is wrong, logs say where, traces say which hop. SLOs say whether it matters.",
  slides: [
    { kicker: "session 08 / slide 1", title: "Three signals,<br>three questions",
      lede: "Most teams drown in logs and have no metrics. The order of usefulness is usually inverted from the order of effort.",
      points: [["Metrics", "is something wrong, at a glance, cheaply."],
                ["Logs", "where exactly, once you know something is wrong."],
                ["Traces", "which hop in the chain, once you know the request."]],
      viz: "abstract" },

    { kicker: "session 08 / slide 2", title: "RED before anything else",
      lede: "Rate, errors, duration. Three panels that answer most questions and fit on one screen.",
      points: [["Rate", "requests per second. The shape of normal."],
                ["Errors", "the share failing. Your first alert."],
                ["Duration", "p95, not average. Averages hide the pain."]],
      viz: "abstract" },

    { kicker: "session 08 / slide 3", title: "Business metrics<br>beat infrastructure metrics",
      lede: "CPU at 60% tells you nothing a customer cares about. 'Signups per minute dropped to zero' does.",
      points: [["Instrument the domain", "created, resolved, failed, queued."],
                ["What it gives you", "a dashboard a non-engineer can read and an alert that means something."],
                ["Cost", "a few lines where the event happens."]],
      viz: "abstract" },

    { kicker: "session 08 / slide 4", title: "Alert on symptoms,<br>not on causes",
      lede: "A page should mean 'a user is affected'. Everything else is a dashboard, or a ticket for the morning.",
      points: [["Page", "error rate above target, availability below SLO."],
                ["Ticket", "disk filling, certificate expiring in two weeks."],
                ["Delete", "any alert nobody has acted on in three months."]],
      viz: "abstract" },

    { kicker: "session 08 / slide 5", title: "Lab - one metric,<br>one SLO, one alert",
      lede: "Three artifacts, each small enough to finish in the session. That is the whole workshop.",
      lab: [
        { title: "Expose and read a metric", body: "Hit your metrics endpoint and find three series you can explain without documentation.", cmd: "curl -s localhost:8080/metrics | head", expect: "a counter, a gauge, a histogram", checkpoint: "I explained three metrics to someone else" },
        { title: "Write an SLO as a query", body: "Turn '95% of requests under 500ms' into an actual expression over your histogram.", checkpoint: "I wrote an SLO I could graph" },
        { title: "Make an alert fire", body: "Alert on 5xx above 2% for five minutes, force errors, watch it fire, then stop.", expect: "state: firing", checkpoint: "I made an alert fire from real traffic" }
      ],
      viz: "abstract" }
  ]
},

{
  id: "s9", n: "09", title: "GitOps - git as the desired state", duration: "90 min", level: "after Kubernetes",
  short: "Deployment becomes a merge. Drift becomes visible. Rollback becomes git revert.",
  slides: [
    { kicker: "session 09 / slide 1", title: "The cluster is not<br>allowed to disagree",
      lede: "GitOps means a controller continuously compares live state to a repository and corrects the difference. That is it - the rest is consequences.",
      points: [["Declarative", "the repository describes the target, not the steps."],
                ["Reconciled", "a controller keeps checking, forever."],
                ["Versioned", "the change and its author are in history."]],
      viz: "abstract" },

    { kicker: "session 09 / slide 2", title: "Deploying is<br>merging a commit",
      lede: "No script from a laptop, no shared credentials, no 'who deployed last?'. The pipeline proposes, review approves, the controller applies.",
      points: [["What changes", "a value in a repository."],
                ["What does not", "a human running commands against production."],
                ["Audit", "the git history is the deployment history."]],
      viz: "abstract" },

    { kicker: "session 09 / slide 3", title: "Self-heal is<br>the feature",
      lede: "Someone edits production by hand at 2am. The controller notices and reverts it. Drift is not a policy you hope for - it is a loop that runs.",
      points: [["Manual edits", "become temporary by definition."],
                ["The trade-off", "emergency debugging requires a scratch namespace, not production."],
                ["Why it is worth it", "the repository is always the truth."]],
      viz: "abstract" },

    { kicker: "session 09 / slide 4", title: "Secrets never live<br>in the repository",
      lede: "GitOps makes the repository authoritative, which makes committing a password catastrophic. Encrypt at rest, decrypt in cluster.",
      points: [["Sealed or external", "sealed secrets, or a secret manager the cluster reads at runtime."],
                ["Bound to a cluster", "encrypted secrets do not travel between clusters without re-sealing."],
                ["Rotation", "possible only if nothing else depends on the value never changing."]],
      viz: "abstract" },

    { kicker: "session 09 / slide 5", title: "Lab - create drift,<br>then deploy by merging",
      lede: "Two demonstrations that make the concept permanent: the cluster fights you, and a merge ships code.",
      lab: [
        { title: "Sync an application", body: "Point a GitOps controller at a path in your repository and sync it.", expect: "Synced / Healthy", checkpoint: "I synced an application from git" },
        { title: "Create drift", body: "Change the replica count by hand and wait. Watch it revert.", cmd: "kubectl scale deploy/api --replicas=1\nsleep 30\nkubectl get deploy api -o jsonpath='{.spec.replicas}'", expect: "3  (reverted)", checkpoint: "I watched self-heal revert a manual change" },
        { title: "Ship by merging", body: "Change the image tag in a values file, merge, and watch the cluster converge without kubectl.", checkpoint: "I deployed by merging a commit" }
      ],
      viz: "abstract" }
  ]
},

{
  id: "s10", n: "10", title: "Capstone - one commit, end to end", duration: "half day", level: "everything",
  short: "Fix a real defect and deliver it through the whole loop, narrating every handoff.",
  slides: [
    { kicker: "session 10 / slide 1", title: "No new concepts.<br>Just the loop.",
      lede: "You will take a real defect from branch to running system. If a stage fails, you debug it. That is the assessment.",
      points: [["The task", "one defect, fixed, tested, shipped."],
                ["The evidence", "green pipeline, a versioned artefact, a deployment revision, a metric that moved."],
                ["The write-up", "one page: what broke, what changed, how you proved it."]],
      viz: "pipeline" },

    { kicker: "session 10 / slide 2", title: "Pick something<br>you can finish",
      lede: "A capstone is not a rewrite. Choose a gap you can close in a few hours and prove with a test.",
      points: [["Good choices", "a missing validation, a failing edge case, a missing test for a known bug."],
                ["Bad choices", "a refactor, a new feature with unclear scope, anything touching the schema."],
                ["Definition of done", "written before you start."]],
      viz: "abstract" },

    { kicker: "session 10 / slide 3", title: "Deliver it and<br>record the numbers",
      lede: "The last slide of the program is your own data. Time from branch to merge, pipeline duration, artefact tag, one metric.",
      lab: [
        { title: "Write acceptance criteria", body: "One sentence describing the observable behaviour after the fix.", checkpoint: "I wrote acceptance criteria before coding" },
        { title: "Ship it through the loop", body: "Branch, implement, open a PR, fix CI, merge, watch the artefact publish, deploy it.", expect: "green pipeline -> sha-tagged artefact -> deployed revision", checkpoint: "My change reached a running environment" },
        { title: "Report the numbers", body: "Record: PR to merge time, pipeline duration, artefact tag, one metric that changed.", checkpoint: "I reported delivery numbers, not impressions" }
      ],
      viz: "pipeline" },

    { kicker: "session 10 / slide 4", title: "What comes next<br>is judgement",
      lede: "Tools change every three years. The judgement - what to automate, what to gate, what to measure - is what compounds. Teach it to someone else and it stays.",
      quote: "If you cannot explain your pipeline end to end, you do not have one yet.",
      quoteAttr: "the only exit criterion that matters",
      viz: "abstract" }
  ]
}
];

