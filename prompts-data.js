/* Curated ready-to-use prompt pack. Pro prompts are unlocked only by a signed local license. */
const FREE_PROMPTS = [
  {id:"sum-article",title:"Summarize an article",category:"Reading",body:"Before summarizing, ask me which language I want. Wait for my answer. Then summarize the source in that language, starting with a short overview, followed by the key points, important facts, dates, and caveats. Do not add unsupported information.\n\nSOURCE:\n[PASTE ARTICLE]"},
  {id:"explain-topic",title:"Explain a difficult topic",category:"Learning",body:"Teach me the topic below from first principles. Start with an intuitive explanation, define essential terms, give one practical example, identify common misconceptions, and finish with 5 short questions to test my understanding.\n\nTOPIC: [TOPIC]\nMY LEVEL: [BEGINNER / INTERMEDIATE / ADVANCED]"},
  {id:"rewrite",title:"Improve my writing",category:"Writing",body:"Rewrite the text to improve clarity, grammar, structure, and flow while preserving its meaning and important details. Keep the tone [TONE]. After the rewrite, list the most important changes. Do not invent information.\n\nTEXT:\n[PASTE TEXT]"},
  {id:"email",title:"Draft a professional email",category:"Work",body:"Draft a clear, courteous, concise email for the situation below. Include a useful subject line. Do not invent facts, promises, or deadlines. Ask me only for essential missing details.\n\nSITUATION: [SITUATION]\nRECIPIENT: [RECIPIENT]\nTONE: [TONE]"},
  {id:"brainstorm",title:"Brainstorm original ideas",category:"Creative",body:"Generate 15 distinct ideas for the goal below. Avoid generic suggestions. For each idea, explain who it helps, why it could work, and one practical first step. Group related ideas and identify the three strongest options.\n\nGOAL: [GOAL]\nCONSTRAINTS: [CONSTRAINTS]"},
  {id:"research-question",title:"Research a question",category:"Research",body:"Research the question carefully. Prioritize primary and authoritative sources. Separate verified facts from interpretation, include dates, cite source links for important claims, and point out uncertainty or conflicting evidence. Never fabricate citations.\n\nQUESTION: [QUESTION]"},
  {id:"code-review",title:"Review code",category:"Coding",body:"Review the code for correctness, security, performance, accessibility, and maintainability. Identify concrete bugs first, explain their impact, then propose minimal fixes. Do not invent APIs. State assumptions where context is missing.\n\nCODE:\n[PASTE CODE]"},
  {id:"debug",title:"Debug an error",category:"Coding",body:"Help debug the issue. First identify the most likely root cause, then give a prioritized diagnostic checklist and a corrected example if possible. Distinguish confirmed facts from hypotheses.\n\nEXPECTED: [EXPECTED]\nACTUAL: [ACTUAL]\nERROR / CODE: [PASTE]"},
  {id:"seo-brief",title:"SEO content brief",category:"Marketing",body:"Create an SEO content brief. Include search intent, target audience, proposed title, meta description, H2/H3 outline, key questions, internal-link ideas, and opportunities for original insight. Do not claim keyword volumes or rankings unless supplied.\n\nTOPIC: [TOPIC]\nAUDIENCE: [AUDIENCE]"},
  {id:"action-plan",title:"Turn a goal into a plan",category:"Productivity",body:"Turn the goal into a realistic plan with milestones, tasks, dependencies, estimated effort, risks, and measurable outcomes. Identify the smallest useful first step.\n\nGOAL: [GOAL]\nTIMEFRAME: [TIMEFRAME]\nAVAILABLE RESOURCES: [RESOURCES]"},
  {id:"compare",title:"Compare options fairly",category:"Decision",body:"Compare the options using criteria relevant to my goal. Present a concise table, explain trade-offs, identify missing information, and recommend an option only when the evidence supports it.\n\nGOAL: [GOAL]\nOPTIONS: [OPTIONS]\nCONSTRAINTS: [CONSTRAINTS]"},
  {id:"meeting",title:"Meeting notes to action items",category:"Work",body:"Convert these notes into a structured summary. Separate decisions, open questions, action items, owners, and due dates. Mark anything not explicitly stated as 'not specified'. Do not infer commitments.\n\nNOTES:\n[PASTE NOTES]"},
  {id:"social",title:"Social media post",category:"Marketing",body:"Create 3 distinct social media post options for the brief. Each should have a strong opening, one clear message, natural language, and a relevant call to action. Avoid exaggerated claims and generic hashtags.\n\nPLATFORM: [PLATFORM]\nAUDIENCE: [AUDIENCE]\nMESSAGE: [MESSAGE]"},
  {id:"translate",title:"Translate with context",category:"Writing",body:"Translate the text into [TARGET LANGUAGE]. Preserve meaning, names, numbers, formatting, and tone. Do not translate proper nouns unnecessarily. Note genuinely ambiguous phrases briefly after the translation.\n\nTEXT:\n[PASTE TEXT]"},
  {id:"lesson",title:"Create a lesson plan",category:"Learning",body:"Create a practical lesson plan on the topic. Include learning objectives, prerequisite knowledge, a short explanation, an activity, examples, a knowledge check, and homework. Match the learner's level and available time.\n\nTOPIC: [TOPIC]\nLEVEL: [LEVEL]\nDURATION: [DURATION]"},
  {id:"data-insights",title:"Find insights in data",category:"Analysis",body:"Analyze the data below. Explain the structure, identify patterns and anomalies, calculate useful metrics where possible, and distinguish observations from causal claims. Mention limitations and suggest next analyses.\n\nDATA:\n[PASTE DATA]"},
  {id:"product-description",title:"Product description",category:"Marketing",body:"Write a compelling but accurate product description. Lead with the user's problem, explain benefits, include verified specifications, and end with a natural call to action. Do not invent features or guarantees.\n\nPRODUCT: [PRODUCT]\nAUDIENCE: [AUDIENCE]\nVERIFIED FEATURES: [FEATURES]"},
  {id:"resume",title:"Improve a résumé bullet",category:"Career",body:"Rewrite the résumé content to be concise, specific, and impact-focused. Use action verbs and quantify results only when the source provides numbers. Do not invent achievements. Provide 3 variations.\n\nROLE: [ROLE]\nCURRENT BULLET: [BULLET]"},
  {id:"interview",title:"Prepare for an interview",category:"Career",body:"Prepare me for an interview for the role below. List likely questions, explain what each question assesses, provide answer structures, and suggest thoughtful questions I can ask. Do not claim knowledge of the exact interview.\n\nROLE: [ROLE]\nCOMPANY / INDUSTRY: [COMPANY]\nEXPERIENCE: [EXPERIENCE]"},
  {id:"customer-support",title:"Customer support response",category:"Work",body:"Draft an empathetic, helpful response to the customer. Acknowledge the issue, explain only confirmed information, give clear next steps, and avoid promises we cannot guarantee.\n\nCUSTOMER MESSAGE: [MESSAGE]\nKNOWN POLICY / FACTS: [FACTS]"},
  {id:"workout-plan",title:"Build a general fitness plan",category:"Lifestyle",body:"Create a general, adaptable fitness plan based on the information below. Include warm-up, exercise selection, sets or duration, rest, progression, and recovery. Flag when professional advice is appropriate.\n\nGOAL: [GOAL]\nEXPERIENCE: [LEVEL]\nEQUIPMENT: [EQUIPMENT]"},
  {id:"recipe",title:"Create a recipe from ingredients",category:"Lifestyle",body:"Suggest a practical recipe using the ingredients below. Give quantities, preparation steps, cooking times, substitutions, and storage notes. Clearly identify assumptions and common allergens.\n\nINGREDIENTS: [INGREDIENTS]\nSERVINGS: [SERVINGS]\nPREFERENCES: [PREFERENCES]"},
  {id:"outline",title:"Create a detailed outline",category:"Writing",body:"Create a logical outline for the content. Include the central thesis, section goals, key points, supporting evidence needed, and a strong conclusion. Avoid repetition and mark gaps that require research.\n\nFORMAT: [FORMAT]\nTOPIC: [TOPIC]\nAUDIENCE: [AUDIENCE]"},
  {id:"risk",title:"Identify project risks",category:"Productivity",body:"Create a project risk register. For each risk include likelihood, impact, early warning signs, mitigation, contingency, and owner. Separate assumptions from known constraints.\n\nPROJECT: [PROJECT]\nCONSTRAINTS: [CONSTRAINTS]"},
  {id:"faq",title:"Generate useful FAQs",category:"Marketing",body:"Generate 10 realistic frequently asked questions and accurate draft answers for the product or service. Include beginner questions, objections, limitations, and support questions. Do not invent policies.\n\nPRODUCT / SERVICE: [PRODUCT]\nKNOWN FACTS: [FACTS]"},
  {id:"argument",title:"Strengthen an argument",category:"Writing",body:"Evaluate the argument below. Identify the claim, evidence, assumptions, weak links, and possible counterarguments. Then propose a stronger version without overstating the evidence.\n\nARGUMENT:\n[PASTE ARGUMENT]"},
  {id:"sql",title:"Write and explain SQL",category:"Coding",body:"Write a SQL query for the task. Explain the logic, note database-specific syntax, consider NULL handling and duplicates, and suggest indexes only where justified. Ask for schema details if essential.\n\nDATABASE: [ENGINE]\nSCHEMA: [SCHEMA]\nTASK: [TASK]"},
  {id:"test-cases",title:"Generate test cases",category:"Coding",body:"Create a test plan for the feature. Include happy paths, edge cases, validation failures, permission problems, security checks, and accessibility. Format as test case, setup, steps, expected result, and priority.\n\nFEATURE: [FEATURE]\nREQUIREMENTS: [REQUIREMENTS]"},
  {id:"plain-language",title:"Explain in plain language",category:"Learning",body:"Rewrite the explanation for a non-expert audience. Use short sentences, define technical terms, include a relatable example, and preserve important caveats. Avoid talking down to the reader.\n\nTEXT:\n[PASTE TEXT]"},
  {id:"press-release",title:"Draft a press release",category:"Marketing",body:"Draft a factual press release with headline, dateline placeholder, lead paragraph, details, a quote placeholder, company boilerplate, and media contact placeholder. Do not invent quotes or facts.\n\nANNOUNCEMENT: [ANNOUNCEMENT]\nVERIFIED DETAILS: [DETAILS]"},
  {id:"policy",title:"Review a policy document",category:"Analysis",body:"Review the policy for clarity, consistency, ambiguity, missing definitions, operational risks, and user impact. This is not legal advice. Identify passages that need review by qualified counsel.\n\nPOLICY:\n[PASTE POLICY]"},
  {id:"product-roadmap",title:"Create a product roadmap",category:"Product",body:"Create a product roadmap with outcomes, user problems, initiatives, dependencies, risks, and measurable success criteria. Separate commitments from hypotheses and avoid false precision in dates.\n\nPRODUCT: [PRODUCT]\nGOALS: [GOALS]\nCONSTRAINTS: [CONSTRAINTS]"},
  {id:"user-stories",title:"Turn requirements into user stories",category:"Product",body:"Convert the requirements into user stories with acceptance criteria, edge cases, and dependencies. Use clear testable language and identify ambiguity before assuming behavior.\n\nREQUIREMENTS:\n[PASTE REQUIREMENTS]"},
  {id:"content-calendar",title:"Build a content calendar",category:"Marketing",body:"Create a four-week content calendar. Include topic, audience, format, main angle, CTA, and production notes. Balance educational, trust-building, and conversion content. Do not repeat the same idea.\n\nBRAND: [BRAND]\nAUDIENCE: [AUDIENCE]\nGOAL: [GOAL]"},
  {id:"citation-check",title:"Check citation quality",category:"Research",body:"Review the citations and claims. Identify which claims are supported, unsupported, outdated, or misrepresented. Do not pretend to open sources you cannot access. Provide a verification checklist.\n\nTEXT AND REFERENCES:\n[PASTE]"},
  {id:"decision-memo",title:"Write a decision memo",category:"Decision",body:"Write a decision memo with context, decision to be made, options, evaluation criteria, recommendation, risks, and next steps. Mark assumptions and missing data.\n\nDECISION: [DECISION]\nOPTIONS: [OPTIONS]\nCONTEXT: [CONTEXT]"},
  {id:"bug-report",title:"Write a clear bug report",category:"Coding",body:"Turn the notes into a reproducible bug report with title, environment, prerequisites, steps, expected behavior, actual behavior, frequency, evidence, and impact. Do not guess missing facts.\n\nNOTES: [NOTES]"},
  {id:"accessibility",title:"Accessibility review",category:"Coding",body:"Review the interface description or code for accessibility. Check keyboard use, focus order, labels, contrast, semantics, errors, and screen-reader output. Give concrete fixes and explain priorities.\n\nCODE / DESCRIPTION:\n[PASTE]"},
  {id:"negotiation",title:"Prepare a negotiation",category:"Career",body:"Help prepare a negotiation plan. Identify goals, priorities, alternatives, evidence, likely objections, concessions, and questions. Keep the approach ethical and realistic.\n\nSITUATION: [SITUATION]\nDESIRED OUTCOME: [OUTCOME]"},
  {id:"creative-story",title:"Develop a story concept",category:"Creative",body:"Develop a fresh story concept with premise, protagonist, motivation, obstacle, stakes, setting, turning points, and a distinctive ending. Avoid clichés and explain what makes the concept original.\n\nGENRE: [GENRE]\nIDEA / THEME: [THEME]"},
  {id:"meeting-agenda",title:"Create a focused meeting agenda",category:"Work",body:"Create a focused agenda with objective, required decisions, timed topics, pre-reading, participants needed, and expected outcomes. Keep the agenda within the stated duration.\n\nMEETING PURPOSE: [PURPOSE]\nDURATION: [DURATION]\nPARTICIPANTS: [PARTICIPANTS]"}
];

const PRO_PROMPTS = [
  {id:"pro-market",title:"Market opportunity analysis",category:"Pro · Business",body:"Analyze the market opportunity. First ask me to specify the geography and time horizon if missing. Structure the analysis around customer segments, demand drivers, alternatives, competitors, barriers, risks, and assumptions. Clearly distinguish sourced facts from estimates. Never invent market-size figures."},
  {id:"pro-prd",title:"Product requirements document",category:"Pro · Product",body:"Create a complete PRD with problem statement, goals and non-goals, personas, user journeys, functional and non-functional requirements, acceptance criteria, analytics, accessibility, security, dependencies, rollout, and open questions. Use {{product_name}} and {{target_user}} as context."},
  {id:"pro-architecture",title:"Software architecture review",category:"Pro · Coding",body:"Review the architecture for reliability, security, scalability, maintainability, operational complexity, and cost. Identify failure modes and trust boundaries. Propose alternatives with trade-offs and a migration plan. Do not invent benchmarks."},
  {id:"pro-competitor",title:"Competitor positioning matrix",category:"Pro · Marketing",body:"Build a competitor positioning matrix for {{our_product}} and the named competitors. Compare target users, primary use cases, differentiators, distribution, pricing model if verified, and weaknesses. Mark unknown data instead of guessing."},
  {id:"pro-investigation",title:"Structured investigation brief",category:"Pro · Research",body:"Create an investigation plan for {{question}}. Break it into subquestions, primary-source targets, verification methods, possible disconfirming evidence, and a source log. Begin by asking which language I want the final report in; wait before writing the report."},
  {id:"pro-sop",title:"Create an operational SOP",category:"Pro · Operations",body:"Create a standard operating procedure for {{process}}. Include purpose, scope, roles, prerequisites, step-by-step instructions, decision points, safety checks, quality criteria, exception handling, records, and revision history."},
  {id:"pro-funnel",title:"Conversion funnel audit",category:"Pro · Marketing",body:"Audit the funnel for {{business_goal}}. Map awareness through retention, identify friction and trust gaps, define measurable events, propose experiments, and rank them by expected impact, confidence, and effort. State the assumptions behind every estimate."},
  {id:"pro-data-dictionary",title:"Create a data dictionary",category:"Pro · Analysis",body:"Create a data dictionary for the provided schema. Include field name, type, definition, units, allowed values, null meaning, sensitivity classification, owner, and validation rules. Flag unclear semantics."},
  {id:"pro-security",title:"Threat modeling workshop",category:"Pro · Coding",body:"Perform a structured threat model for {{system}}. Identify assets, trust boundaries, entry points, threat actors, abuse cases, mitigations, residual risks, and verification tests. Prioritize actionable issues and avoid speculative claims."},
  {id:"pro-launch",title:"Product launch plan",category:"Pro · Product",body:"Build a launch plan for {{product}} targeting {{audience}}. Include positioning, proof points, messaging, channels, launch assets, support readiness, risks, milestones, launch-day checklist, and success metrics."},
  {id:"pro-rfp",title:"Evaluate an RFP response",category:"Pro · Work",body:"Evaluate the proposal against each RFP requirement. Create a compliance matrix, identify evidence gaps, risks, clarification questions, and response priorities. Never claim compliance without supporting evidence."},
  {id:"pro-editorial",title:"Editorial quality review",category:"Pro · Writing",body:"Edit the manuscript for structure, argument, consistency, terminology, voice, accessibility, and factual claims. Return high-priority issues first, then examples of revisions. Preserve the author's intent."},
  {id:"pro-research-synthesis",title:"Synthesize multiple sources",category:"Pro · Research",body:"Synthesize the supplied sources. Identify shared findings, disagreements, source quality, recency, missing perspectives, and what cannot be concluded. Cite each point using the source labels provided. Do not treat repetition as independent confirmation."},
  {id:"pro-financial-model",title:"Review a business model",category:"Pro · Business",body:"Review the business model assumptions and scenario logic. Identify revenue drivers, cost drivers, unit economics, sensitivity variables, cash-flow risks, and missing inputs. Do not provide investment advice or fabricate financial data."},
  {id:"pro-training",title:"Design a team training program",category:"Pro · Learning",body:"Design a training program for {{team}} to achieve {{capability}}. Include competency levels, modules, practice tasks, assessment rubrics, manager reinforcement, and metrics to evaluate transfer to real work."}
];


/* Expanded original Pro collection for v22. Built using clear roles, context, explicit output structure, and evidence constraints. */
PRO_PROMPTS.push(...[
  {
    "id": "pro-executive-brief",
    "title": "Executive decision brief",
    "category": "Business",
    "body": "Prepare an executive brief for {{decision}}. Begin with the decision required and a concise recommendation. Then provide context, options, evaluation criteria, evidence, financial and operational implications, risks, reversibility, dependencies, and the next decision date. Separate verified facts, estimates, and assumptions. If key information is missing, list the exact questions rather than inventing answers."
  },
  {
    "id": "pro-business-model-canvas",
    "title": "Business model canvas",
    "category": "Business",
    "body": "Build a business model canvas for {{business_idea}} and {{customer_segment}}. Cover customer segments, value propositions, channels, customer relationships, revenue streams, key resources, activities, partnerships, and cost structure. For each block, state the riskiest assumption and one low-cost validation experiment."
  },
  {
    "id": "pro-unit-economics",
    "title": "Unit economics diagnostic",
    "category": "Business",
    "body": "Analyze the unit economics for {{product}} using only the figures I provide. Define each metric, show formulas, calculate contribution margin and payback where possible, and flag missing inputs. Create conservative, base, and optimistic scenarios only when the assumptions are explicit. Do not invent benchmark values or present this as investment advice."
  },
  {
    "id": "pro-pricing-research",
    "title": "Pricing research plan",
    "category": "Business",
    "body": "Design a pricing research plan for {{offer}} aimed at {{audience}}. Compare value metric options, packaging hypotheses, willingness-to-pay research methods, competitor evidence to collect, discount risks, and ethical testing approaches. Provide interview questions and a decision framework; do not fabricate competitor prices."
  },
  {
    "id": "pro-sales-discovery",
    "title": "B2B sales discovery guide",
    "category": "Sales",
    "body": "Create a discovery-call guide for {{product}} and {{target_account}}. Organize questions around current workflow, business impact, urgency, stakeholders, decision criteria, budget process, risks, and success measures. Include follow-up questions, red flags, and a concise call-note template. Avoid manipulative or pressure-based tactics."
  },
  {
    "id": "pro-objection-handling",
    "title": "Sales objection response builder",
    "category": "Sales",
    "body": "For each objection about {{product}}, produce: what the prospect may mean, one empathetic clarifying question, an evidence-based response, proof to offer, and a respectful next step. Distinguish a genuine product gap from a misunderstanding. Never invent customer results, case studies, or guarantees."
  },
  {
    "id": "pro-customer-persona",
    "title": "Customer research persona",
    "category": "Marketing",
    "body": "Create an evidence-based customer profile for {{market}} using the supplied research. Include goals, jobs-to-be-done, pain points, buying triggers, objections, alternatives, and preferred information sources. Label unsupported details as hypotheses and end with questions that would validate or disprove the profile."
  },
  {
    "id": "pro-brand-voice",
    "title": "Brand voice and messaging system",
    "category": "Marketing",
    "body": "Develop a practical brand voice guide for {{brand}}. Define audience, promise, personality traits, tone by context, vocabulary to use and avoid, proof standards, and examples for website, email, and social content. Keep claims factual and flag any statement that needs evidence."
  },
  {
    "id": "pro-seo-content-brief",
    "title": "SEO content brief",
    "category": "Marketing",
    "body": "Create an SEO content brief for {{keyword}} targeting {{audience}}. Include search intent hypotheses, reader questions, angle, outline, entities and subtopics to investigate, internal-link opportunities, evidence requirements, and a useful call to action. Do not claim search volume, ranking difficulty, or current SERP features unless I provide verified data."
  },
  {
    "id": "pro-campaign-review",
    "title": "Campaign performance review",
    "category": "Marketing",
    "body": "Review the campaign data I provide for {{campaign}}. Check tracking completeness, calculate relevant rates, compare cohorts or periods where valid, identify likely drivers, and separate correlation from causation. Return an executive summary, findings, caveats, and prioritized experiments. Never fill missing metrics with estimates unless clearly marked."
  },
  {
    "id": "pro-email-sequence",
    "title": "Lifecycle email sequence",
    "category": "Marketing",
    "body": "Design a {{number_of_emails}}-email sequence for {{audience}} to achieve {{goal}}. For each email provide timing, purpose, subject-line options, preview text, body copy, CTA, and personalization fields. Vary the value offered across the sequence, respect consent and unsubscribe expectations, and avoid false urgency."
  },
  {
    "id": "pro-product-analytics",
    "title": "Product analytics event plan",
    "category": "Product",
    "body": "Create an analytics plan for {{feature}}. Define user outcomes, key questions, event names, trigger conditions, properties, identity rules, funnels, retention views, and privacy considerations. Include a tracking QA checklist and explain which decisions each metric should inform. Collect only data needed for the stated purpose."
  },
  {
    "id": "pro-user-journey",
    "title": "End-to-end user journey map",
    "category": "Product",
    "body": "Map the journey for {{user_type}} completing {{job_to_be_done}}. Show stages, user goals, actions, touchpoints, emotions, friction, accessibility needs, and backstage dependencies. Identify moments that matter and propose improvements ranked by impact, confidence, and implementation effort."
  },
  {
    "id": "pro-feature-prioritization",
    "title": "Feature prioritization workshop",
    "category": "Product",
    "body": "Prioritize the proposed features for {{product_goal}}. First clarify the target outcome and constraints. Score each idea using an explicitly defined framework such as impact, confidence, effort, risk, and strategic fit. Explain trade-offs, identify dependencies, and provide a sensitivity check showing how rankings change when weights change."
  },
  {
    "id": "pro-release-readiness",
    "title": "Release readiness review",
    "category": "Product",
    "body": "Assess whether {{release_name}} is ready to ship. Review scope, acceptance criteria, test evidence, telemetry, security, privacy, accessibility, documentation, support readiness, rollback, and known issues. Classify findings as blocker, high, medium, or low and give an owner/action for every blocker. Do not infer test completion without evidence."
  },
  {
    "id": "pro-frontend-review",
    "title": "Frontend engineering review",
    "category": "Coding",
    "body": "Review the supplied frontend code for correctness, maintainability, performance, accessibility, responsive behavior, and security. Prioritize reproducible defects over stylistic preferences. For each finding include file/area, impact, example failure, and a minimal fix. Do not rewrite unrelated modules or claim code was executed unless tests were actually run."
  },
  {
    "id": "pro-api-contract",
    "title": "API contract design",
    "category": "Coding",
    "body": "Design an API contract for {{resource_or_workflow}}. Specify endpoints, methods, request and response schemas, validation, authentication assumptions, pagination, filtering, idempotency, error model, versioning, rate limits, and examples. Highlight unresolved product decisions. Avoid including secrets or assuming an undocumented backend."
  },
  {
    "id": "pro-database-review",
    "title": "Database schema and query review",
    "category": "Coding",
    "body": "Review the proposed database schema and queries for integrity, normalization trade-offs, indexing, concurrency, migration safety, access control, and data lifecycle. Identify query patterns before proposing indexes. Provide a migration/rollback strategy and sample tests. Do not assume a database engine if it has not been specified."
  },
  {
    "id": "pro-refactor-plan",
    "title": "Safe refactoring plan",
    "category": "Coding",
    "body": "Create a behavior-preserving refactoring plan for {{module}}. First map current responsibilities and dependencies. Propose small stages, characterization tests, compatibility constraints, observability, rollback points, and measurable completion criteria. Do not suggest a wholesale rewrite unless the evidence supports it."
  },
  {
    "id": "pro-incident-postmortem",
    "title": "Blameless incident postmortem",
    "category": "Operations",
    "body": "Prepare a blameless postmortem for {{incident}} using the supplied timeline and evidence. Include impact, detection, response, contributing conditions, what went well, what made response harder, and prioritized corrective actions with owners and verification criteria. Avoid assigning personal blame or inventing causal facts."
  },
  {
    "id": "pro-ops-process-map",
    "title": "Process mapping and improvement",
    "category": "Operations",
    "body": "Map the current process for {{process_name}} from trigger to completion. Identify roles, inputs, outputs, handoffs, waiting time, rework, controls, and failure paths. Then propose improvements with expected benefits, risks, and a pilot plan. Mark assumptions and preserve required compliance controls."
  },
  {
    "id": "pro-vendor-evaluation",
    "title": "Vendor evaluation scorecard",
    "category": "Operations",
    "body": "Create a vendor evaluation scorecard for {{service_category}}. Define weighted criteria for functionality, security, privacy, reliability, support, integration, portability, cost transparency, and exit strategy. Include evidence required for each score and a question set for vendor demonstrations. Do not award scores without evidence."
  },
  {
    "id": "pro-sop-audit",
    "title": "SOP quality and safety audit",
    "category": "Operations",
    "body": "Audit the supplied SOP for completeness and usability. Check purpose, scope, role clarity, prerequisites, sequence, decision points, hazards, exceptions, escalation, records, and revision control. Identify ambiguous instructions and propose precise replacement wording. Flag any safety-sensitive steps for qualified review."
  },
  {
    "id": "pro-research-question",
    "title": "Research question refinement",
    "category": "Research",
    "body": "Refine {{topic}} into a focused, answerable research question. Explain scope, population or context, concepts, time horizon, and boundaries. Offer three alternative formulations and a rationale for each. Identify what evidence would answer the question and what evidence would not."
  },
  {
    "id": "pro-literature-matrix",
    "title": "Literature review evidence matrix",
    "category": "Research",
    "body": "Organize the supplied papers into an evidence matrix with citation as provided, research question, method, sample/context, findings, limitations, and relevance. Compare studies without treating different methods as directly equivalent. Mark information absent from the supplied text as not reported; never invent bibliographic details."
  },
  {
    "id": "pro-source-audit",
    "title": "Source credibility and bias audit",
    "category": "Research",
    "body": "Audit each supplied source for authorship, publication venue, methodology, evidence quality, conflicts of interest, date, scope, and limitations. Distinguish factual reliability from viewpoint. Explain which claims each source can support and what independent corroboration is still needed."
  },
  {
    "id": "pro-policy-analysis",
    "title": "Policy options analysis",
    "category": "Research",
    "body": "Analyze policy options for {{policy_question}}. Define the problem and desired outcomes, compare feasible options, affected groups, implementation requirements, costs, risks, equity considerations, and evaluation metrics. Separate empirical evidence from value judgments and list uncertainties and unintended consequences."
  },
  {
    "id": "pro-course-design",
    "title": "Professional course blueprint",
    "category": "Learning",
    "body": "Design a course on {{subject}} for {{learner_profile}}. Define prerequisites, measurable learning outcomes, modules, practice activities, authentic assessment, feedback, accessibility, and estimated workload. Align every activity with an outcome and include a plan for evaluating whether learners can transfer skills to practice."
  },
  {
    "id": "pro-assessment-rubric",
    "title": "Assessment rubric builder",
    "category": "Learning",
    "body": "Build an analytic rubric for {{assignment_or_skill}}. Use 4–6 criteria and clearly differentiated performance levels. Describe observable evidence at each level, avoid vague adjectives, and include scoring guidance and a calibration example. Ensure the criteria assess the stated learning outcomes."
  },
  {
    "id": "pro-tutor-session",
    "title": "Socratic tutoring session",
    "category": "Learning",
    "body": "Tutor me on {{topic}} at {{level}}. Start by asking what I already know and what I need to achieve. Teach one concept at a time, use a worked example, ask me a short question, wait for my answer, then correct misconceptions kindly. Do not reveal the complete solution before I attempt the task."
  },
  {
    "id": "pro-resume-impact",
    "title": "Achievement-focused resume rewrite",
    "category": "Career",
    "body": "Rewrite the supplied resume bullets for {{target_role}}. Preserve factual accuracy, emphasize scope and outcomes, and use strong but truthful verbs. Do not invent numbers, tools, seniority, or responsibilities. Where evidence is missing, insert a clear placeholder and ask what measurable result can be verified."
  },
  {
    "id": "pro-interview-panel",
    "title": "Structured interview question bank",
    "category": "Career",
    "body": "Create a structured interview guide for {{role}}. Map each question to a job-related competency, include behavioral and situational questions, useful follow-up probes, and evidence-based scoring anchors. Avoid discriminatory or irrelevant personal questions and make the process consistent across candidates."
  },
  {
    "id": "pro-performance-review",
    "title": "Balanced performance review",
    "category": "Career",
    "body": "Draft a fair performance review for {{person_or_role}} using only the examples provided. Separate outcomes, behaviors, strengths, growth areas, and support needed. Use specific observations rather than personality judgments, note context and constraints, and agree measurable next-period goals."
  },
  {
    "id": "pro-editorial-style",
    "title": "Publication style sheet",
    "category": "Writing",
    "body": "Create a style sheet for {{publication_or_brand}} from the supplied samples. Record spelling conventions, capitalization, punctuation, number/date formats, terminology, voice, formatting, and accessibility preferences. Include examples of preferred and discouraged usage and flag inconsistencies in the source material."
  },
  {
    "id": "pro-technical-docs",
    "title": "Technical documentation package",
    "category": "Writing",
    "body": "Create user-facing technical documentation for {{product_or_feature}}. Include overview, prerequisites, step-by-step instructions, expected results, troubleshooting, limitations, security/privacy notes, and related tasks. Use consistent terms and warn before irreversible actions. Identify gaps that need product-owner confirmation."
  },
  {
    "id": "pro-case-study",
    "title": "Evidence-based customer case study",
    "category": "Writing",
    "body": "Draft a customer case study from the approved notes for {{customer}}. Structure it as context, challenge, approach, implementation, outcomes, and lessons. Use only approved facts and metrics, distinguish customer quotes from editorial copy, and insert approval placeholders wherever evidence or consent is missing."
  },
  {
    "id": "pro-translation-review",
    "title": "Professional translation QA",
    "category": "Writing",
    "body": "Review the translation between {{source_language}} and {{target_language}} against the source. Check meaning, terminology, tone, register, cultural context, formatting, numbers, names, and omissions. Provide corrected text plus a concise issue log. Do not add content that is not present in the source."
  },
  {
    "id": "pro-customer-escalation",
    "title": "Customer escalation response",
    "category": "Support",
    "body": "Draft a calm, accountable response to {{customer_issue}}. Acknowledge the impact, summarize verified facts, explain the next action and timing only when known, and ask for any missing information. Do not blame the customer, promise an unverified fix, or disclose internal confidential details."
  },
  {
    "id": "pro-support-knowledgebase",
    "title": "Support knowledge-base article",
    "category": "Support",
    "body": "Turn the supplied resolution into a reusable knowledge-base article. Include symptoms, environment, cause if verified, prerequisites, numbered steps, expected result, troubleshooting branches, and escalation criteria. Write for the reader's skill level and do not include credentials or private customer data."
  },
  {
    "id": "pro-voice-of-customer",
    "title": "Voice of customer synthesis",
    "category": "Support",
    "body": "Synthesize the supplied customer feedback. Group themes, preserve representative anonymized examples, estimate frequency only when counts are provided, identify contradictory needs, and distinguish requests from root problems. Recommend follow-up research and product actions with confidence levels."
  },
  {
    "id": "pro-risk-register",
    "title": "Project risk register",
    "category": "Project",
    "body": "Create a risk register for {{project}}. For each risk include cause, event, consequence, likelihood, impact, owner role, prevention, contingency, trigger, and residual risk. Use the project's actual constraints; do not invent probabilities. Highlight risks that require a decision or escalation."
  },
  {
    "id": "pro-project-recovery",
    "title": "Project recovery plan",
    "category": "Project",
    "body": "Create a recovery plan for {{project}} based on the current status. Identify scope, schedule, resource, quality, dependency, and stakeholder issues. Separate confirmed blockers from suspected causes, propose immediate containment, re-baselining options, owners, and weekly indicators of recovery."
  },
  {
    "id": "pro-workshop-facilitator",
    "title": "Decision workshop facilitator",
    "category": "Work",
    "body": "Design a {{duration}} workshop to help {{participants}} decide {{decision}}. Include desired outputs, pre-work, agenda with timings, facilitation prompts, inclusion techniques, conflict handling, decision rule, and follow-up actions. Make clear which items are discussion versus decisions."
  },
  {
    "id": "pro-meeting-synthesis",
    "title": "Meeting transcript to action log",
    "category": "Work",
    "body": "Convert the supplied meeting notes into a concise record. Extract decisions, actions, accountable owner (only when stated), due date (only when stated), unresolved questions, risks, and dependencies. Separate explicit agreements from suggestions and mark unclear ownership as unassigned."
  },
  {
    "id": "pro-spreadsheet-audit",
    "title": "Spreadsheet model audit",
    "category": "Analysis",
    "body": "Audit the supplied spreadsheet structure or formulas. Check input/output separation, formula consistency, hard-coded values, units, date logic, missing data, circular references, edge cases, and reconciliation checks. Identify assumptions and provide a test plan. Do not claim to inspect cells or sheets not supplied."
  },
  {
    "id": "pro-data-story",
    "title": "Data storytelling narrative",
    "category": "Analysis",
    "body": "Turn the supplied analysis into a data story for {{audience}}. State the question, key finding, supporting evidence, context, limitations, and recommended action. Explain chart choices and avoid causal language unless supported by the design. Preserve units, denominators, and uncertainty."
  },
  {
    "id": "pro-scenario-planning",
    "title": "Scenario planning workshop",
    "category": "Strategy",
    "body": "Develop three plausible scenarios for {{strategic_question}} over {{time_horizon}}. Identify driving forces, critical uncertainties, signposts, implications, and robust actions. Avoid treating scenarios as predictions; explain what would cause each scenario to become more likely."
  },
  {
    "id": "pro-change-management",
    "title": "Organizational change plan",
    "category": "Strategy",
    "body": "Create a change plan for {{change}} affecting {{groups}}. Map stakeholders, impacts, readiness, messages, training, local champions, feedback routes, resistance risks, adoption measures, and reinforcement. Identify what leadership must decide and do, not just what employees must accept."
  },
  {
    "id": "pro-privacy-review",
    "title": "Privacy impact pre-review",
    "category": "Security",
    "body": "Conduct a preliminary privacy review of {{feature_or_workflow}}. Map data categories, purposes, collection points, recipients, retention, user control, access, transfers, and threat scenarios. Suggest data minimization and privacy-by-design improvements. This is an issue-spotting aid, not a legal compliance determination."
  },
  {
    "id": "pro-security-review",
    "title": "Application security review checklist",
    "category": "Security",
    "body": "Create a threat-informed security review checklist for {{application}}. Cover authentication, authorization, input handling, secrets, dependency risk, logging, data exposure, session management, browser boundaries, and recovery. For each check include evidence to inspect and a safe test approach. Do not propose destructive testing against systems without authorization."
  },
  {
    "id": "pro-creative-direction",
    "title": "Creative campaign concept",
    "category": "Creative",
    "body": "Develop three distinct creative directions for {{campaign_goal}} aimed at {{audience}}. For each provide a central idea, emotional insight, message hierarchy, visual/audio cues, sample headline, execution examples, and brand-safety risks. Avoid clichés and explain how each concept can be recognized as distinct."
  },
  {
    "id": "pro-video-production",
    "title": "Video production brief",
    "category": "Creative",
    "body": "Create a production-ready video brief for {{video_goal}}. Include audience, message, platform, duration, format, scene-by-scene structure, voiceover, on-screen text, visual direction, sound, accessibility captions, assets, and CTA. Keep the script within the duration and flag claims needing substantiation."
  },
  {
    "id": "pro-podcast-plan",
    "title": "Podcast episode blueprint",
    "category": "Creative",
    "body": "Plan a podcast episode about {{topic}} for {{audience}}. Include the listener promise, angle, segment timings, host questions, guest research, transitions, fact-check points, sound design, and closing CTA. Avoid leading questions and identify claims that require independent verification."
  },
  {
    "id": "pro-accessibility-audit",
    "title": "Digital accessibility audit plan",
    "category": "Quality",
    "body": "Review the supplied page or component against practical accessibility principles. Check semantic structure, keyboard order, visible focus, names/labels, contrast evidence, zoom/reflow, error feedback, motion, and screen-reader announcements. Distinguish confirmed issues from checks that require manual assistive-technology testing."
  },
  {
    "id": "pro-test-strategy",
    "title": "Risk-based test strategy",
    "category": "Quality",
    "body": "Create a risk-based test strategy for {{system_or_release}}. Identify critical user journeys, failure impact, test levels, environments, data setup, automation candidates, exploratory sessions, accessibility, security, performance, and exit criteria. Prioritize by risk and explain what remains untested."
  },
  {
    "id": "pro-experiment-design",
    "title": "Product experiment design",
    "category": "Quality",
    "body": "Design an experiment for {{hypothesis}}. Define population, unit of randomization, primary and guardrail metrics, eligibility, duration assumptions, sample-size inputs needed, instrumentation, contamination risks, stopping rules, and interpretation limits. Do not fabricate statistical power or declare significance without data."
  }
]);
