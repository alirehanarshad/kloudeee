import fs from "fs";
import path from "path";

const root = process.cwd();

const providers = [
  { key: "aws", dir: "public/assets/AWS", output: "aws.json", label: "AWS" },
  { key: "azure", dir: "public/assets/AZURE", output: "azure.json", label: "Azure" },
  { key: "gcp", dir: "public/assets/GCP", output: "gcp.json", label: "GCP" },
];

const acronymMap = new Map([
  ["ai", "AI"],
  ["api", "API"],
  ["apis", "APIs"],
  ["app", "App"],
  ["apps", "Apps"],
  ["ar", "AR"],
  ["aws", "AWS"],
  ["aad", "AAD"],
  ["ad", "AD"],
  ["aks", "AKS"],
  ["arc", "Arc"],
  ["arm", "ARM"],
  ["arvr", "AR/VR"],
  ["avd", "AVD"],
  ["b2b", "B2B"],
  ["b2c", "B2C"],
  ["bi", "BI"],
  ["ca", "CA"],
  ["cdn", "CDN"],
  ["ci", "CI"],
  ["cpu", "CPU"],
  ["crm", "CRM"],
  ["cx", "CX"],
  ["db", "DB"],
  ["ddos", "DDoS"],
  ["devops", "DevOps"],
  ["dns", "DNS"],
  ["ec2", "EC2"],
  ["ecs", "ECS"],
  ["eks", "EKS"],
  ["ekm", "EKM"],
  ["entra", "Entra"],
  ["etl", "ETL"],
  ["fhir", "FHIR"],
  ["gce", "GCE"],
  ["gcp", "GCP"],
  ["gke", "GKE"],
  ["gpu", "GPU"],
  ["hci", "HCI"],
  ["hdi", "HDI"],
  ["hpc", "HPC"],
  ["hsm", "HSM"],
  ["http", "HTTP"],
  ["https", "HTTPS"],
  ["iam", "IAM"],
  ["id", "ID"],
  ["ids", "IDS"],
  ["iot", "IoT"],
  ["ip", "IP"],
  ["ir", "IR"],
  ["it", "IT"],
  ["json", "JSON"],
  ["kpi", "KPI"],
  ["kusto", "Kusto"],
  ["ml", "ML"],
  ["nat", "NAT"],
  ["nlp", "NLP"],
  ["os", "OS"],
  ["pim", "PIM"],
  ["qna", "QnA"],
  ["qa", "QA"],
  ["rdp", "RDP"],
  ["rtos", "RTOS"],
  ["sap", "SAP"],
  ["sdk", "SDK"],
  ["smb", "SMB"],
  ["sql", "SQL"],
  ["ssh", "SSH"],
  ["ssd", "SSD"],
  ["ssis", "SSIS"],
  ["sso", "SSO"],
  ["tcp", "TCP"],
  ["tpu", "TPU"],
  ["ui", "UI"],
  ["vm", "VM"],
  ["vms", "VMs"],
  ["vmss", "VMSS"],
  ["vpc", "VPC"],
  ["vpn", "VPN"],
  ["vr", "VR"],
  ["waf", "WAF"],
  ["web", "Web"],
  ["wi", "WI"],
  ["xdr", "XDR"],
]);

const categoryRules = [
  { category: "AI & Machine Learning", keywords: ["ai", "ml", "machine", "learning", "cognitive", "vision", "speech", "language", "openai", "anomaly", "recommend", "recognizer", "vertex", "dialogflow", "automl", "agent", "assist", "personalizer", "qna", "bot", "nlp", "text", "translation"] },
  { category: "Analytics & Business Intelligence", keywords: ["analytics", "analysis", "bigquery", "looker", "data-studio", "monitor", "insights", "advisor", "metrics", "log", "logging", "dashboard", "profiler", "trace", "x-ray", "cost", "billing", "report", "query", "warehouse"] },
  { category: "Compute", keywords: ["ec2", "ecs", "eks", "compute", "engine", "vm", "virtual", "container", "functions", "app-service", "app-engine", "serverless", "batch", "run", "spring", "kubernetes", "aks", "gke", "lambda", "instance", "fabric", "cluster"] },
  { category: "Storage", keywords: ["storage", "disk", "bucket", "blob", "files", "file", "archive", "backup", "snapshot", "ssd", "filestore", "databox", "queue"] },
  { category: "Database", keywords: ["database", "db", "sql", "redis", "cache", "cosmos", "spanner", "bigtable", "dynamodb", "postgres", "mysql", "mariadb", "cassandra", "datastore", "firestore"] },
  { category: "Networking & Content Delivery", keywords: ["network", "vpc", "vpn", "gateway", "router", "route", "cdn", "dns", "traffic", "interconnect", "peering", "load-balancer", "load", "front-door", "private-link", "expressroute", "nat", "subnet", "firewall", "cloudflare"] },
  { category: "Security & Identity", keywords: ["security", "identity", "iam", "entra", "directory", "defender", "protection", "key", "vault", "secret", "policy", "compliance", "waf", "shield", "ddos", "access", "auth", "authentication", "governance", "permissions", "certificate"] },
  { category: "Developer Tools & DevOps", keywords: ["dev", "devops", "code", "build", "deploy", "pipeline", "artifact", "registry", "cloud-shell", "powershell", "cli", "sdk", "deployment", "composer", "workbench", "studio"] },
  { category: "Integration & Messaging", keywords: ["api", "event", "bus", "queue", "workflow", "logic", "connect", "connector", "integration", "pubsub", "notification", "topic", "relay", "service-bus", "eventarc", "scheduler", "tasks"] },
  { category: "Migration & Hybrid", keywords: ["migration", "migrate", "transfer", "hybrid", "anthos", "arc", "stack", "edge", "vmware", "import", "export", "landing-zone", "modernization"] },
  { category: "IoT & Edge", keywords: ["iot", "device", "edge", "industrial", "sphere", "fleet", "sensor", "hardware"] },
  { category: "Management & Governance", keywords: ["management", "manager", "admin", "administration", "resource", "policy", "monitoring", "operations", "ops", "config", "configuration", "portal", "catalog", "quota", "advisor", "support"] },
];

function readTitle(svgPath) {
  const text = fs.readFileSync(svgPath, "utf8");
  const match = text.match(/<title>([^<]+)<\/title>/i);
  return match ? match[1].trim() : "";
}

function normalizeTitleCandidate(title, providerLabel) {
  if (!title) return "";
  let value = title
    .replace(/^Icon[-_ ]*/i, "")
    .replace(/^Icon-Architecture-Category\/\d+\//i, "")
    .replace(/^Icon[-_ ]?\d+px[-_ ]?/i, "")
    .replace(/^Product[-_ ]Icons?/i, "")
    .replace(/_Color$/i, "")
    .replace(/_Category.*$/i, "")
    .replace(/_32$/i, "")
    .replace(/_24px.*$/i, "")
    .replace(/\b24px\b/gi, "")
    .replace(/\b32\b/g, "")
    .replace(/\bArch\b/gi, "")
    .replace(/\bArchitecture\b/gi, "")
    .replace(/\bGroup\b/gi, "")
    .replace(/[_/]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();

  if (!value) return "";
  if (/^Icon\b/i.test(value)) return "";
  if (providerLabel === "GCP" && /^Google Cloud$/i.test(value)) return "";
  return smartTitle(value);
}

function smartTitle(input) {
  return input
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => {
      const lower = part.toLowerCase();
      if (acronymMap.has(lower)) return acronymMap.get(lower);
      if (/^[a-z]\d+$/i.test(part)) return part.toUpperCase();
      if (/^\d+[a-z]+$/i.test(part)) return part.toUpperCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ")
    .replace(/\bAnd\b/g, "and");
}

function deriveName(fileBase, providerLabel, title) {
  let base = fileBase.replace(/\.svg$/i, "");
  if (providerLabel === "AWS" && base.startsWith("aws-")) base = base.slice(4);
  if (providerLabel === "Azure" && base.startsWith("azure-")) base = base.slice(6);
  if (providerLabel === "GCP" && base.startsWith("gcp-")) base = base.slice(4);
  const filenameName = smartTitle(base.replace(/[._]+/g, "-"));
  if (filenameName.length > 2) return filenameName;

  const normalizedTitle = normalizeTitleCandidate(title, providerLabel);
  if (normalizedTitle && normalizedTitle.length > 2) return normalizedTitle;

  return filenameName;
}

function tokenize(value) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function scoreCategory(name, fileBase, title) {
  const text = `${name} ${fileBase} ${title}`;
  const tokens = tokenize(text);
  const tokenSet = new Set(tokens);
  const normalized = ` ${tokens.join(" ")} `;
  let best = { category: "General Cloud Service", score: 0 };
  for (const rule of categoryRules) {
    const score = rule.keywords.reduce((sum, keyword) => {
      const keyTokens = tokenize(keyword);
      if (keyTokens.length === 1) return sum + (tokenSet.has(keyTokens[0]) ? 1 : 0);
      const phrase = ` ${keyTokens.join(" ")} `;
      return sum + (normalized.includes(phrase) ? 1 : 0);
    }, 0);
    if (score > best.score) best = { category: rule.category, score };
  }
  return {
    category: best.category,
    confidence: best.score >= 3 ? "high" : best.score >= 1 ? "medium" : "low",
  };
}

function buildKeywords(name, fileBase, category, provider) {
  const raw = `${name} ${fileBase} ${category} ${provider}`
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/[\s-]+/)
    .filter((part) => part && part.length > 2);

  return [...new Set(raw)].slice(0, 12);
}

function descriptionText({ provider, name, category, keywords }) {
  const kw = keywords.slice(0, 5).join(", ");
  return `${name} is represented here as a ${provider} product icon and is grouped under ${category}. This record is designed to make the asset useful beyond simple display by pairing the SVG path with a clear service name, a practical classification, and narrative context that can support search, filtering, documentation, catalog views, and architecture tooling. In most teams, an icon like this is not only a visual marker; it becomes a shorthand for capability, ownership, platform selection, and integration boundaries. The description therefore frames ${name} as a service-level building block that can appear in reference architectures, internal portals, capability maps, cloud inventories, onboarding guides, design workshops, and operating-model discussions. The included keywords such as ${kw} help downstream systems build tags and improve discovery. Even when the exact commercial packaging changes over time, the entry stays useful because it captures the service at a conceptual level: what kind of problem it addresses, where it likely belongs in a solution stack, and why teams would recognize the icon in diagrams, service catalogs, or cloud modernization work. The extra metadata also helps product directories, cloud explorers, and internal search experiences present the icon with enough context to be understandable without reading the raw filename alone. That makes the entry practical for both human readers and software systems that need stable labels, searchable text, and consistent cloud-service metadata at scale.`;
}

function purposeText({ provider, name, category }) {
  return `${name} is typically used to represent a ${provider} capability within the broader ${category} space, and the purpose of this metadata entry is to make that icon operationally meaningful. A raw SVG file only gives a team a picture; it does not explain what the service implies, where it should be applied, how it fits into a cloud estate, or why an architect, developer, operator, analyst, or platform owner would select it. This purpose field bridges that gap by turning the icon into a documented asset that can support architecture repositories, searchable service galleries, internal cloud portals, design systems, enablement material, migration inventories, and automated recommendation experiences. In practical terms, ${name} can stand for a distinct platform capability, a managed service, a governance control, a developer tool, or an integration point. When teams use the icon in solution diagrams, they usually need more than recognition; they need language that explains intent, boundaries, expected value, and the kinds of workloads or processes the service can support.\n\nFrom a delivery perspective, the purpose of ${name} in a catalog is to help teams choose correctly and communicate consistently. Product managers may use it to describe a target-state capability, architects may use it to compare implementation patterns, developers may use it to identify the managed building block they need, and operations teams may use it to understand dependency chains and support ownership. For platform and governance teams, structured metadata around the icon supports curation, search, lifecycle management, standards alignment, and policy-aware self-service. That matters because cloud environments become difficult to govern when services are represented only by filenames or scattered tribal knowledge. A normalized entry gives each icon a stable identity and enough context to participate in portals, asset registries, diagram builders, and training materials.\n\nAt the solution level, ${name} generally signals that some part of the system relies on a managed cloud function rather than a generic undifferentiated resource. Depending on the workload, that could mean enabling application hosting, storage, database operations, network connectivity, analytics, security enforcement, event-driven integration, AI functionality, or day-two management. By classifying ${name} under ${category}, this dataset also makes it easier to group related services, compare alternatives, and build guided experiences for users who may not know the exact service name yet. That is especially important in mixed-cloud environments, where users often search by intent first and by product name second.\n\nThis entry is also intended to be durable. The exact marketing language for a cloud product can evolve, but the practical purpose of a metadata record remains stable: identify the service, point to the visual asset, explain the role the service tends to play, and provide enough text for search, onboarding, and automation workflows. Used this way, ${name} becomes more than an icon on disk. It becomes a reusable knowledge object that supports discovery, architecture communication, internal documentation, cloud platform governance, and consistent experience design across applications, diagrams, and service selection workflows.`;
}

function serviceType(category) {
  switch (category) {
    case "AI & Machine Learning":
      return "managed-ai-service";
    case "Analytics & Business Intelligence":
      return "analytics-service";
    case "Compute":
      return "compute-service";
    case "Storage":
      return "storage-service";
    case "Database":
      return "database-service";
    case "Networking & Content Delivery":
      return "network-service";
    case "Security & Identity":
      return "security-service";
    case "Developer Tools & DevOps":
      return "developer-tool";
    case "Integration & Messaging":
      return "integration-service";
    case "Migration & Hybrid":
      return "migration-service";
    case "IoT & Edge":
      return "edge-service";
    case "Management & Governance":
      return "management-service";
    default:
      return "cloud-service";
  }
}

function generateProviderData(providerConfig) {
  const absoluteDir = path.join(root, providerConfig.dir);
  const files = fs
    .readdirSync(absoluteDir)
    .filter((file) => file.toLowerCase().endsWith(".svg"))
    .sort((a, b) => a.localeCompare(b));

  return files.map((file, index) => {
    const fileBase = file.replace(/\.svg$/i, "");
    const svgPath = path.join(absoluteDir, file);
    const title = readTitle(svgPath);
    const name = deriveName(fileBase, providerConfig.label, title);
    const { category, confidence } = scoreCategory(name, fileBase, title);
    const keywords = buildKeywords(name, fileBase, category, providerConfig.label);
    const slug = `${providerConfig.key}-${fileBase}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    return {
      id: `${providerConfig.key}-${String(index + 1).padStart(4, "0")}`,
      provider: providerConfig.label,
      name,
      category,
      serviceType: serviceType(category),
      purpose: purposeText({ provider: providerConfig.label, name, category }),
      description: descriptionText({ provider: providerConfig.label, name, category, keywords }),
      image: `/${providerConfig.dir.replace(/^public\//, "").replace(/\\/g, "/")}/${file}`,
      sourceFile: `${providerConfig.dir.replace(/\\/g, "/")}/${file}`,
      slug,
      svgTitle: title || null,
      keywords,
      categoryConfidence: confidence,
    };
  });
}

for (const provider of providers) {
  const data = generateProviderData(provider);
  const outPath = path.join(root, provider.output);
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`Generated ${provider.output}: ${data.length} entries`);
}
