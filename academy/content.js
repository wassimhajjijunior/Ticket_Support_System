/* Curriculum data. One session = one workshop.
   `sim` picks the interactive component; `lab` is what the room runs. */

window.SESSIONS = [
  {
    id: "s0", n: "00", title: "Orientation  -  the whole map first",
    duration: "60 min", level: "no prerequisites",
    short: "What DevOps is, the lifecycle, the four numbers that define it, and where each later session fits.",
    goal: "By the end you can draw the delivery loop from memory and name what breaks when a stage is missing.",
    concept: {
      intro: "DevOps is not a tool and not a team. It is the property of a delivery system where change is cheap and failure is survivable. Every session after this one is a single stage of the loop.",
      points: [
        ["The loop", "plan -> code -> build -> test -> release -> deploy -> operate -> monitor -> plan. A stage you skip does not disappear; it moves to production, at 3am, with a customer watching."],
        ["Two kinds of work", "building the change (CI) and carrying it to users safely (CD). Most beginners learn only the first."],
        ["The four numbers", "deployment frequency, lead time for change, change failure rate, time to restore. DORA uses them because they are measurable and hard to fake."],
        ["What this program is", "eleven sessions. Each one: concept -> simulation -> lab you run -> checkpoint. You do not watch DevOps, you do it."]
      ],
      diagram: "loop"
    },
    sim: null,
    lab: [
      { title: "Draw the loop", body: "On paper, draw the eight stages and write one failure per stage  -  what goes wrong if that stage is missing.", checkpoint: "I drew the loop and named one failure per stage" },
      { title: "Find the gaps in your own project", body: "Take a project you have built. Mark which of the eight stages you actually have, and which you assumed someone else did.", checkpoint: "I marked my own project against the loop" }
    ],
    real: {
      path: "docs/ROADMAP.md",
      lang: "md",
      snippet: "# One-week delivery plan\nDay 1  Linux + manual deploy   -> a JAR under systemd\nDay 2  Docker + Compose        -> one command, three services\nDay 3  CI/CD                   -> tests, scan, versioned image\nDay 4  Terraform               -> infrastructure from code\nDay 5  Kubernetes + Helm       -> probes, rollouts, scale\nDay 6  Observability           -> metrics, logs, SLOs\nDay 7  GitOps                  -> git is the desired state"
    }
  },

  {
    id: "s1", n: "01", title: "Git  -  the commit-to-production graph",
    duration: "75 min", level: "needs: a terminal",
    short: "What actually happens when you commit, push, open a PR and merge  -  told as a graph, not a list of commands.",
    goal: "You can explain the difference between local and remote, why a PR is not a merge, and what the pipeline sees at each step.",
    concept: {
      intro: "Most people learn git as commands. The commands are easy; the graph is what matters. Your repository is two graphs  -  local and remote  -  and every command is a way of moving a pointer or copying commits between them.",
      points: [
        ["commit", "creates a node in your local graph. Nothing has left your machine."],
        ["push", "copies local commits to the remote graph. It can be rejected if the remote moved  -  that is not a bug, it is protection."],
        ["pull request", "a *request*, not a merge. It creates a review surface and triggers CI on the proposed branch."],
        ["merge", "moves the remote branch pointer and adds a merge node. This is the first moment the change exists for everyone."],
        ["Tag", "a name for one commit. Release tags are how you get back to exactly what ran."]
      ],
      diagram: "git"
    },
    sim: "git",
    lab: [
      { title: "Watch the graph move", body: "Use the simulation above: make three commits, push, open a PR, merge. Say out loud which graph changed at each step.", checkpoint: "I can name which graph changes on commit vs push vs merge" },
      { title: "Break it on purpose", body: "In a scratch repository: commit locally, then make a change on the remote (edit a file on GitHub) and try to push. Read the rejection.", cmd: "git clone <your-repo> scratch && cd scratch\necho \"local\" >> README.md\ngit commit -am \"local change\"\n# now edit README on GitHub, then:\ngit push", expect: "! [rejected] main -> main (fetch first)\nerror: failed to push some refs" },
      { title: "Recover like a professional", body: "Pull with rebase, resolve, push again. Note what the graph looks like afterwards.", cmd: "git pull --rebase origin main\ngit push", expect: "Successfully rebased and updated refs/heads/main.", checkpoint: "I resolved a rejected push with rebase" },
      { title: "Make a tag that means something", body: "Tag the commit you would deploy, then list tags.", cmd: "git tag -a v0.1.0 -m \"first deployable build\"\ngit push origin v0.1.0\ngit tag --list", expect: "v0.1.0", checkpoint: "I created and pushed an annotated tag" }
    ],
    real: {
      path: ".github/workflows/ci.yml",
      lang: "yaml",
      snippet: "on:\n  pull_request:          # CI runs on the proposal, not on main\n  push:\n    branches: [main]\n\nconcurrency:\n  group: ci-${{ github.ref }}\n  cancel-in-progress: true   # a new push cancels the previous run"
    }
  },

  {
    id: "s2", n: "02", title: "Docker  -  image, layers, Dockerfile, Compose",
    duration: "120 min", level: "needs: Docker installed",
    short: "Build the mental model of an image as a stack of layers, then prove why instruction order decides your build time.",
    goal: "You can read any Dockerfile and predict which layers will be cached, which will rebuild, and why the image runs as a non-root user.",
    concept: {
      intro: "An image is not a folder. It is an ordered stack of read-only layers, produced one Dockerfile instruction at a time. A container adds one thin writable layer on top. Everything else  -  caching, rebuild speed, security  -  follows from that single fact.",
      points: [
        ["Layers are cached by instruction + inputs", "Change one instruction and every layer after it is invalidated. That is why dependency installation goes before source code."],
        ["Multi-stage = two images, one file", "The build stage has Maven and source; the runtime stage copies only the artefact. The toolchain never ships."],
        ["Volumes outlive containers", "The writable layer dies with the container. Data survives only in a volume or a bind mount."],
        ["Compose is ordering, not packaging", "It starts services, but correctness comes from healthchecks: `depends_on: service_healthy` waits for ready, not for started."]
      ],
      diagram: "docker"
    },
    sim: "docker",
    lab: [
      { title: "Predict before you build", body: "Look at the Dockerfile in the simulation. Write down which layers will be cached on a second build after only `src/` changes. Then check.", checkpoint: "I predicted the cache behaviour and was right" },
      { title: "Build it for real", body: "Build the API image, note the size, then rebuild after touching a source file and compare timing.", cmd: "cd app\ndocker build -f ../docker/Dockerfile.api -t relay-api:lab .\ndocker images relay-api:lab\ntouch src/main/java/com/support_tickets/demo/SupportTicketsApplication.java\ndocker build -f ../docker/Dockerfile.api -t relay-api:lab .", expect: "second build: dependency layers report CACHED, only the last layers rebuild", checkpoint: "I saw cached vs rebuilt layers in real output" },
      { title: "Inspect the image", body: "Prove the container is non-root and see the filesystem layout.", cmd: "docker run --rm --entrypoint sh relay-api:lab -c \"id && ls -la /app | head\"", expect: "uid=1001(app) gid=1001(app)\n/app/lib  /app/app.jar", checkpoint: "I confirmed the runtime user is not root" },
      { title: "Lose the data on purpose", body: "Start Compose with a database, insert something, then remove the stack with and without the volume.", cmd: "docker compose -f docker/docker-compose.yml up -d db\ndocker compose -f docker/docker-compose.yml down\n# restart, data is still there\ndocker compose -f docker/docker-compose.yml down -v\n# restart, database is empty", expect: "down keeps the volume; down -v destroys it", checkpoint: "I know which command deletes my data" }
    ],
    real: {
      path: "docker/Dockerfile.api",
      lang: "dockerfile",
      snippet: "FROM maven:3.9-eclipse-temurin-21 AS build\nCOPY pom.xml ./\nRUN --mount=type=cache,target=/root/.m2 mvn -B -ntp -q dependency:go-offline\nCOPY src ./src                     # only this invalidates the layers below\nRUN --mount=type=cache,target=/root/.m2 mvn -B -ntp -DskipTests package\n\nFROM eclipse-temurin:21-jre-alpine AS runtime\nRUN addgroup -S app && adduser -S -G app -u 1001 app\nUSER 1001                          # non-root, always\nENTRYPOINT [\"java\", \"-jar\", \"app.jar\"]"
    }
  },

  {
    id: "s3", n: "03", title: "CI  -  the pipeline, stage by stage",
    duration: "90 min", level: "needs: a GitHub repo",
    short: "Run a pipeline in the simulation, break a test, then watch a real one block a merge.",
    goal: "You can explain what each stage proves, why order matters, and what should block a merge versus what should only warn.",
    concept: {
      intro: "CI answers exactly one question on every change: did this break anything? Each stage is a different kind of proof  -  checkout gives you the code, build proves it compiles, tests prove behaviour, scan proves it is not knowingly vulnerable.",
      points: [
        ["Fail fast", "cheap stages first. A pipeline that takes 40 minutes gets bypassed by humans, and bypassed pipelines are decoration."],
        ["Path filtering", "a frontend change should not compile Java. In a monorepo this is the difference between 20 seconds and 90."],
        ["Upload the evidence", "when a test fails in CI you cannot attach a debugger. Upload the reports or you will rerun blind."],
        ["Gates have severities", "a failing test blocks. A HIGH vulnerability usually reports. A CRITICAL with an available fix blocks. Choose deliberately."]
      ],
      diagram: "ci"
    },
    sim: "pipeline",
    lab: [
      { title: "Run it green", body: "In the simulation, run the pipeline and name what each stage proves before clicking the next one.", checkpoint: "I named what each stage proves" },
      { title: "Break it", body: "Toggle the failing test and run again. Note the exact stage that stops and what the stages after it show.", checkpoint: "I know which stages are skipped when a test fails" },
      { title: "Break your real CI", body: "On a branch, make a test fail and open a PR. Watch the check go red and confirm it blocks merge.", cmd: "git switch -c break-ci\n# edit a test assertion to be false\ngit commit -am \"test: intentionally failing\"\ngit push -u origin break-ci\n# open a PR on GitHub, watch the check", expect: "Backend  /  build + tests  failing", checkpoint: "I saw CI block a real PR" },
      { title: "Read a real log", body: "Open the Actions tab, find the 'Detect changes' job, and explain why the backend job was skipped on a web-only commit.", expect: "Filter backend = false", checkpoint: "I explained a skipped job from the log" }
    ],
    real: {
      path: ".github/workflows/ci.yml",
      lang: "yaml",
      snippet: "jobs:\n  changes:\n    steps:\n      - uses: dorny/paths-filter@v3\n        id: filter\n        with:\n          filters: |\n            backend: ['app/**', 'docker/Dockerfile.api']\n            frontend: ['web/**', 'docker/Dockerfile.web']\n\n  backend:\n    needs: changes\n    if: needs.changes.outputs.backend == 'true'\n    steps:\n      - run: chmod +x mvnw\n      - run: ./mvnw -B -ntp verify     # verify, not test: runs integration tests too"
    }
  },

  {
    id: "s4", n: "04", title: "Registry & releases  -  tags, digests, rollback",
    duration: "60 min", level: "after CI",
    short: "Why `latest` is not a version, and how a SHA tag makes rollback a one-line operation.",
    goal: "You can publish an image, explain digest vs tag, and roll back to a previous build without guessing.",
    concept: {
      intro: "A registry is where an artefact becomes a fact. The unit of truth is the digest  -  the content hash. Tags are just names pointing at digests, and a name can be moved.",
      points: [
        ["Immutable artefact", "build once, promote the same image. Rebuilding per environment means you never tested what runs."],
        ["SHA tags", "`sha-1664073` names the commit. It is traceable and it cannot silently change under you."],
        ["Rollback is a feature", "if you cannot name the previous version, you do not have one."],
        ["Digests beat tags for pinning", "production should pin a digest, not a tag someone can overwrite."]
      ],
      diagram: "registry"
    },
    sim: null,
    lab: [
      { title: "Publish and pull", body: "Tag your local image with a commit SHA, push it, then pull it back by that tag.", cmd: "docker tag relay-api:lab ghcr.io/<you>/relay-api:sha-lab\ndocker push ghcr.io/<you>/relay-api:sha-lab\ndocker rmi ghcr.io/<you>/relay-api:sha-lab\ndocker pull ghcr.io/<you>/relay-api:sha-lab", expect: "Status: Downloaded newer image", checkpoint: "I published and pulled a SHA-tagged image" },
      { title: "Inspect the digest", body: "Compare the digest of two tags and prove whether they are the same image.", cmd: "docker inspect --format='{{index .RepoDigests 0}}' ghcr.io/<you>/relay-api:sha-lab", expect: "ghcr.io/<you>/relay-api@sha256:...", checkpoint: "I read a digest and explained tag vs digest" },
      { title: "Rehearse a rollback", body: "Aim a deployment at the new tag, then move it back to the previous SHA tag and confirm the old version is running.", expect: "previous version serving again", checkpoint: "I rolled back by tag" }
    ],
    real: {
      path: ".github/workflows/cd.yml",
      lang: "yaml",
      snippet: "- uses: docker/metadata-action@v5\n  with:\n    images: ${{ steps.image.outputs.ref }}\n    tags: |\n      type=sha,format=short,prefix=sha-\n      type=raw,value=latest,enable={{is_default_branch}}"
    }
  },

  {
    id: "s5", n: "05", title: "Security  -  scanning the artefact you ship",
    duration: "75 min", level: "after registry",
    short: "Scan a real image, read a CVE row, and decide what blocks a merge versus what gets accepted in writing.",
    goal: "You can run a scan, interpret fix versions, and write an accepted-risk note that a reviewer would accept.",
    concept: {
      intro: "You scan the artefact, not the repository. The image is the only thing that runs, and it contains OS packages your lockfile never mentions.",
      points: [
        ["Read the fix column", "a CVE without an available fix cannot be remediated by you. `ignore-unfixed` exists for that reason."],
        ["Severity is not exploitability", "a CRITICAL in a path you never execute still matters for compliance, less for risk."],
        ["Accepted risk is written", "CVE id, reason, exposure, review date. Silence is not acceptance."],
        ["Secrets are not config", "a secret in a Dockerfile layer is in the history forever. Inject at runtime."]
      ],
      diagram: "security"
    },
    sim: null,
    lab: [
      { title: "Scan your own image", body: "Run Trivy against the image you built and read the summary line.", cmd: "docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \\\n  ghcr.io/aquasecurity/trivy:latest image --severity CRITICAL,HIGH \\\n  --ignore-unfixed relay-api:lab", expect: "Total: N (HIGH: x, CRITICAL: y)", checkpoint: "I ran a scan and read the totals" },
      { title: "Pick one finding and judge it", body: "Choose one CRITICAL. Find its fix version, decide whether you can upgrade, and write two sentences explaining your decision.", checkpoint: "I wrote an accepted-risk note with a reason" },
      { title: "Prove a gate works", body: "Set exit-code 1 on CRITICAL and confirm the command fails. That failure is what a pipeline gate is.", cmd: "docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \\\n  ghcr.io/aquasecurity/trivy:latest image --exit-code 1 \\\n  --severity CRITICAL --ignore-unfixed relay-api:lab; echo \"exit=$?\"", expect: "exit=1", checkpoint: "I made a scan fail on purpose" }
    ],
    real: {
      path: ".trivyignore",
      lang: "text",
      snippet: "# CVE-2026-65182  -  tomcat-embed-core 10.1.56\n#   Advisory lists 10.1.58 as the fix, but it is not published to\n#   Maven Central yet. 10.1.56 is the newest resolvable artefact.\n#   Exposure: JSON APIs only, not internet-facing.\n#   ACTION: bump <tomcat.version> as soon as 10.1.58 resolves.\nCVE-2026-65182"
    }
  },

  {
    id: "s6", n: "06", title: "Terraform  -  infrastructure you can review",
    duration: "120 min", level: "needs: an AWS or LocalStack target",
    short: "Write a plan, read the diff before it happens, then destroy everything and prove nothing is left.",
    goal: "You can read a plan like a diff, explain state, and run apply/destroy without fear.",
    concept: {
      intro: "Clicking in a console produces a system nobody can rebuild. Terraform produces a plan you review before anything happens  -  that review is the whole discipline.",
      points: [
        ["Plan is a diff", "green add, yellow change, red destroy. Read it before you type yes."],
        ["State is the map", "remote, locked, versioned. Lose it and Terraform wants to recreate the world."],
        ["Modules are functions", "network, database, compute  -  inputs and outputs, not copy-paste."],
        ["Destroy is part of the workflow", "if you cannot tear it down, you do not control it."]
      ],
      diagram: "iac"
    },
    sim: null,
    lab: [
      { title: "Plan before you apply", body: "Write a minimal VPC, run plan, and read every line before applying.", cmd: "terraform init\nterraform validate\nterraform plan -out tfplan", expect: "Plan: 3 to add, 0 to change, 0 to destroy.", checkpoint: "I read a plan line by line" },
      { title: "Break the state", body: "Move a resource block, plan again, and explain why Terraform wants to destroy and recreate.", checkpoint: "I explained why renaming a resource recreates it" },
      { title: "Clean up and verify", body: "Destroy, then confirm in the console that nothing is left billing.", cmd: "terraform destroy", expect: "Destroy complete! Resources: 3 destroyed.", checkpoint: "I destroyed everything and verified it" }
    ],
    real: {
      path: "docs/ROADMAP.md",
      lang: "text",
      snippet: "Day 4  -  Terraform\n  bootstrap/   S3 state + DynamoDB lock\n  network/     VPC, 2 public subnets, no NAT (cost)\n  database/    RDS PostgreSQL, skip_final_snapshot = true\n  compute/     EC2 + IAM instance profile + user-data Docker\n  rule: destroy at the end of every session"
    }
  },

  {
    id: "s7", n: "07", title: "Kubernetes  -  probes, rollouts, and why pods die",
    duration: "120 min", level: "needs: kind installed",
    short: "Deploy a real service to a local cluster, then break it four ways and diagnose each from events only.",
    goal: "You can read a CrashLoopBackOff and tell whether it is a probe, a limit, an image or a selector.",
    concept: {
      intro: "You stop starting containers and start declaring what should exist. The cluster converges reality to your declaration  -  including restarting, rescheduling and refusing traffic.",
      points: [
        ["Startup vs liveness vs readiness", "startup gives slow apps time; liveness restarts; readiness removes from the load balancer. Confusing them is the #1 cause of self-inflicted outages."],
        ["Limits decide whether the JVM survives", "heap above the container limit is an OOMKill, not an exception."],
        ["Rollouts are rehearsed", "`rollout undo` is one command  -  practise it before you need it."],
        ["Diagnose from events", "`describe` and `get events` answer most questions. Logs answer the rest."]
      ],
      diagram: "k8s"
    },
    sim: null,
    lab: [
      { title: "Deploy", body: "Create a kind cluster, apply a Deployment and Service, and confirm the pod is Ready (not just Running).", cmd: "kind create cluster\nkubectl apply -f k8s/\nkubectl get pods -w", expect: "1/1 Running", checkpoint: "I deployed and read pod readiness" },
      { title: "Break the readiness probe", body: "Point readiness at a wrong path and watch the pod stay Running but leave the endpoints.", cmd: "kubectl patch deploy/api -p '{\"spec\":{\"template\":{\"spec\":{\"containers\":[{\"name\":\"api\",\"readinessProbe\":{\"httpGet\":{\"path\":\"/nope\"}}}]}}}}'\nkubectl get endpoints", expect: "pod Running, endpoints empty", checkpoint: "I explained Running vs Ready" },
      { title: "OOM it", body: "Set a memory limit below what the JVM needs, and confirm the exit code is 137.", cmd: "kubectl get pod <pod> -o jsonpath='{.status.containerStatuses[0].lastState.terminated.exitCode}'", expect: "137", checkpoint: "I diagnosed an OOMKill from the exit code" },
      { title: "Roll back", body: "Deploy a bad image, then roll back to the previous revision.", cmd: "kubectl set image deploy/api api=ghcr.io/x/api:nope\nkubectl rollout status deploy/api\nkubectl rollout undo deploy/api", expect: "deployment \"api\" successfully rolled back", checkpoint: "I performed a rollback" }
    ],
    real: {
      path: "docker/docker-compose.yml",
      lang: "yaml",
      snippet: "healthcheck:\n  test: [\"CMD-SHELL\", \"wget -qO- http://127.0.0.1:8080/actuator/health || exit 1\"]\n  start_period: 60s      # Spring Boot needs time to boot\ndepends_on:\n  db:\n    condition: service_healthy   # waits for ready, not for started"
    }
  },

  {
    id: "s8", n: "08", title: "Observability  -  metrics, logs, one good alert",
    duration: "90 min", level: "after Kubernetes",
    short: "Emit a business metric, build one dashboard panel, and write an alert a human would actually act on.",
    goal: "You can answer 'is it healthy, is it fast, what broke' without opening a terminal.",
    concept: {
      intro: "Metrics tell you something is wrong, logs tell you where, traces tell you which hop. SLOs tell you whether it matters. Most teams have logs only.",
      points: [
        ["RED first", "rate, errors, duration  -  three panels that answer most questions."],
        ["Business metrics beat infrastructure metrics", "tickets created per minute says more than CPU."],
        ["Alert on symptoms", "a user-visible failure, not every spike."],
        ["One SLO is better than none", "99.5% availability and 95% under 500 ms is enough to start."]
      ],
      diagram: "obs"
    },
    sim: null,
    lab: [
      { title: "Read the metrics endpoint", body: "Hit the actuator endpoint and find three metrics you can explain.", cmd: "curl -s localhost:8080/actuator/prometheus | grep -E 'jvm_memory_used|http_server_requests' | head", expect: "jvm_memory_used_bytes{...}\nhttp_server_requests_seconds_count{...}", checkpoint: "I found and explained three metrics" },
      { title: "Define one SLO", body: "Write your SLO as a sentence and then as a query: '95% of requests under 500ms' -> histogram_quantile over http_server_requests.", checkpoint: "I wrote an SLO as a query" },
      { title: "Write one alert that fires", body: "Create an alert for 5xx rate above 2% for 5 minutes, then force 500s and watch it fire.", expect: "alert: HighErrorRate, state: firing", checkpoint: "I made an alert fire" }
    ],
    real: {
      path: "app/src/main/resources/application.properties",
      lang: "properties",
      snippet: "management.endpoints.web.exposure.include=health,info,prometheus,metrics\nmanagement.endpoint.health.probes.enabled=true\nmanagement.metrics.tags.application=support-tickets"
    }
  },

  {
    id: "s9", n: "09", title: "GitOps  -  git as the desired state",
    duration: "90 min", level: "after Kubernetes",
    short: "Install Argo CD, deploy from a repo, then change the cluster by hand and watch it revert.",
    goal: "You can explain drift, self-heal, and why deploying by merging is safer than deploying by scripting.",
    concept: {
      intro: "GitOps means the cluster continuously compares itself to a repository. A manual change is drift, and drift is reverted. Deployment becomes a merge.",
      points: [
        ["Declarative, versioned, automated, reconciled", "the four properties from the OpenGitOps principles."],
        ["Self-heal is the point", "the cluster is not allowed to disagree with git."],
        ["Secrets stay out", "sealed or external  -  never plaintext in the repo."],
        ["Rollback is `git revert`", "which every developer already knows."]
      ],
      diagram: "gitops"
    },
    sim: null,
    lab: [
      { title: "Install and connect", body: "Install Argo CD, create an Application pointing at the helm chart, sync it.", cmd: "kubectl create namespace argocd\nkubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml\nkubectl port-forward svc/argocd-server -n argocd 8080:443", expect: "Synced / Healthy", checkpoint: "I synced an application from git" },
      { title: "Create drift", body: "Scale the deployment by hand, then watch Argo revert it.", cmd: "kubectl scale deploy/api --replicas=1 -n ticket\n# wait, then\nkubectl get deploy api -n ticket -o jsonpath='{.spec.replicas}'", expect: "3   # reverted back", checkpoint: "I watched self-heal revert a manual change" },
      { title: "Deploy by merging", body: "Change an image tag in values.yaml, merge, and watch the cluster converge without running kubectl.", expect: "new pods, new revision in Argo", checkpoint: "I deployed by merging a commit" }
    ],
    real: {
      path: "docs/ROADMAP.md",
      lang: "text",
      snippet: "Day 7  -  GitOps\n  install Argo CD on kind\n  Application -> k8s/chart, syncPolicy.automated { prune, selfHeal }\n  prove: kubectl edit is reverted\n  close the loop: CI bumps image.tag in values-dev.yaml"
    }
  },

  {
    id: "s10", n: "10", title: "Capstone  -  one commit, end to end",
    duration: "half day", level: "everything",
    short: "Break the app, ship the fix through the full pipeline, and prove it in the dashboard.",
    goal: "You can deliver a change from branch to running system and explain every handoff on the way.",
    concept: {
      intro: "No new concepts. You run the loop once, with a real defect, and narrate each stage. If a stage fails, you debug it  -  that is the assessment.",
      points: [
        ["The task", "fix a real defect in this repository and get it to a running environment."],
        ["The evidence", "green CI, a SHA-tagged image, a deployment revision, a dashboard that shows it."],
        ["The write-up", "one page: what broke, what you changed, how you proved it."]
      ],
      diagram: "loop"
    },
    sim: null,
    lab: [
      { title: "Pick a defect", body: "Choose one known gap (pagination on the queue, a missing test, a UI empty state) and write the acceptance criteria." },
      { title: "Ship it", body: "Branch, implement, open a PR, fix CI, merge, watch CD publish, then deploy.", expect: "CI green -> image sha-xxxx -> deployed revision", checkpoint: "My change reached a running environment" },
      { title: "Prove it with numbers", body: "Record: time from PR to merge, CI duration, image tag, and one metric that changed.", checkpoint: "I reported the delivery numbers" }
    ],
    real: {
      path: "docs/HANDOFF.md",
      lang: "text",
      snippet: "Verify it yourself\n  app>  mvnw -B clean verify            # 34 tests, H2, no database\n  web>  npx tsc --noEmit && npm run lint && npm run build\n  curl  localhost:3000/api/actuator/health   # proves the rewrite\n  compose up -d                          # db healthy -> api -> web"
    }
  }
];

