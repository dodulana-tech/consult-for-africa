/**
 * Render the four live Belfiore forms into public/ from lib/belfiore-survey.ts.
 *
 * The lib is the single source of truth, so a question can never be worded one
 * way in the definition and another way on the form. Re-run after any edit:
 *
 *   npx tsx scripts/build-belfiore-survey-pages.ts
 */

import { writeFileSync } from "fs";
import { join } from "path";
import { BELFIORE_SURVEYS, type SurveyMeta, type ScaleQuestion } from "../lib/belfiore-survey";

const PUBLIC = join(__dirname, "..", "public");
const ENDPOINT = "/api/belfiore-audit/responses";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const CSS = `
  :root{
    --navy:#0B3C5D; --deep:#081521; --gold:#D4AF37; --teal:#1F7A8C;
    --body:#1F2937; --muted:#6B7280; --surface:#F1F5F9; --line:#E2E8F0;
    --cream:#FBF6E6; --white:#fff;
  }
  *{box-sizing:border-box}
  html,body{margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
       color:var(--body);background:#eef2f6;line-height:1.5;font-size:16px}
  .wrap{max-width:720px;margin:0 auto;padding:0 16px 64px}
  header.top{background:var(--navy);color:#fff;padding:22px 0 20px;border-bottom:3px solid var(--gold)}
  header.top .wrap{padding-top:0;padding-bottom:0}
  .eyebrow{color:var(--gold);font-weight:700;font-size:12px;letter-spacing:.14em;text-transform:uppercase}
  header.top h1{font-size:22px;margin:6px 0 2px;line-height:1.2}
  header.top p{margin:0;color:#C9D6E0;font-size:14px}
  .card{background:#fff;border:1px solid var(--line);border-radius:12px;padding:18px;margin:16px 0;
        box-shadow:0 1px 2px rgba(8,21,33,.04)}
  .privacy{background:var(--cream);border-left:4px solid var(--gold)}
  .privacy strong{color:var(--navy)}
  .scalekey{background:var(--surface);border-left:4px solid var(--teal);font-size:14px}
  .scalekey b{color:var(--navy)}
  h2.section{font-size:16px;color:var(--navy);margin:26px 2px 8px;padding-top:6px;
             border-top:1px solid var(--line)}
  h2.section .n{color:var(--teal);font-weight:800;margin-right:8px}
  h2.section .hint{font-weight:400;color:var(--muted);font-size:13px;display:block;margin-top:2px}
  .q{padding:14px 0;border-bottom:1px solid var(--line)}
  .q:last-child{border-bottom:0}
  .q .qt{font-size:15px;margin-bottom:10px}
  .q .qt .num{color:var(--muted);font-weight:700;margin-right:6px}
  .opts{display:flex;flex-wrap:wrap;gap:8px}
  .opts label{flex:1 1 auto;min-width:56px;text-align:center;border:1px solid var(--line);
     border-radius:9px;padding:9px 6px;font-size:13px;cursor:pointer;background:#fff;user-select:none}
  .opts.five label{min-width:0}
  .opts input{position:absolute;opacity:0;width:0;height:0}
  .opts label:hover{border-color:var(--teal)}
  .opts label.na{color:var(--muted);flex-basis:100%;min-width:100%;margin-top:2px}
  .opts label:has(input:checked){background:var(--navy);color:#fff;border-color:var(--navy)}
  .opts label:has(input:checked) .sub{color:#C9D6E0}
  .opts .big{display:block;font-weight:800;font-size:15px;line-height:1}
  .opts .sub{display:block;font-size:11px;color:var(--muted);margin-top:3px}
  textarea,select,input[type=text]{width:100%;font:inherit;padding:10px 12px;border:1px solid var(--line);
     border-radius:9px;background:#fff;color:var(--body)}
  textarea{min-height:74px;resize:vertical}
  .field{margin:12px 0}
  .field label.lbl{display:block;font-size:14px;margin-bottom:6px}
  .progress{position:sticky;top:0;z-index:5;background:#eef2f6;padding:10px 0}
  .bar{height:8px;background:var(--line);border-radius:20px;overflow:hidden}
  .bar>i{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--teal),var(--gold));transition:width .25s}
  .bar-t{font-size:12px;color:var(--muted);margin:6px 2px 0}
  button.submit{width:100%;background:var(--navy);color:#fff;border:0;border-radius:11px;
     padding:16px;font-size:16px;font-weight:700;cursor:pointer;margin-top:8px}
  button.submit:disabled{opacity:.6;cursor:not-allowed}
  .foot{color:var(--muted);font-size:12px;text-align:center;margin-top:22px}
  .thanks{display:none;text-align:center;padding:40px 10px}
  .thanks h2{color:var(--navy)}
  .thanks .check{width:56px;height:56px;border-radius:50%;background:var(--cream);color:var(--gold);
     display:inline-flex;align-items:center;justify-content:center;font-size:30px;border:2px solid var(--gold)}
  .checks{display:flex;flex-wrap:wrap;gap:8px}
  .checks .chk{flex:1 1 210px;border:1px solid var(--line);border-radius:9px;padding:9px 11px;
     font-size:13.5px;cursor:pointer;background:#fff;user-select:none;display:flex;align-items:center;gap:8px}
  .checks .chk:hover{border-color:var(--teal)}
  .checks .chk:has(input:checked){background:var(--navy);color:#fff;border-color:var(--navy)}
  .err{background:#fdecec;border-left:4px solid #c0392b;color:#7a2f2f;font-size:14px;display:none}
`;

const AGREE = [
  ["1", "Strongly disagree"], ["2", "Disagree"], ["3", "Neither"],
  ["4", "Agree"], ["5", "Strongly agree"],
];

function scaleBlock(q: ScaleQuestion, n: number): string {
  const opts = AGREE.map(
    ([v, lbl]) =>
      `<label><input type="radio" name="${q.key}" value="${v}"><span class="big">${v}</span><span class="sub">${lbl}</span></label>`
  ).join("\n        ");
  return `      <div class="q">
        <div class="qt"><span class="num">${n}.</span>${esc(q.text)}</div>
        <div class="opts five">
        ${opts}
        <label class="na"><input type="radio" name="${q.key}" value="NA">N/A &middot; Do not know</label>
        </div>
      </div>`;
}

function build(s: SurveyMeta): string {
  // group scale questions by section, preserving definition order
  const sections: { name: string; qs: ScaleQuestion[] }[] = [];
  for (const q of s.questions) {
    let sec = sections.find((x) => x.name === q.section);
    if (!sec) { sec = { name: q.section, qs: [] }; sections.push(sec); }
    sec.qs.push(q);
  }

  let n = 0;
  const body = sections
    .map((sec, i) => {
      const qs = sec.qs.map((q) => scaleBlock(q, ++n)).join("\n");
      return `  <h2 class="section"><span class="n">${String(i + 1).padStart(2, "0")}</span>${esc(sec.name)}</h2>
  <div class="card">
${qs}
  </div>`;
    })
    .join("\n\n");

  const multis = s.multi
    .map(
      (m) => `    <div class="field"><label class="lbl">${esc(m.label)}</label>
      <div class="checks">
${m.options
  .map(
    (o) =>
      `        <label class="chk"><input type="checkbox" name="${m.key}" value="${esc(o)}"> ${esc(o)}</label>`
  )
  .join("\n")}
      </div></div>`
    )
    .join("\n");

  const cats =
    s.categorical.length || multis
      ? `  <h2 class="section"><span class="n">${String(sections.length + 1).padStart(2, "0")}</span>A little about you
    <span class="hint">So we can read the answers properly. Never used to identify anybody.</span></h2>
  <div class="card">
${s.categorical
  .map(
    (c) => `    <div class="field"><label class="lbl">${esc(c.label)}</label>
      <select name="${c.key}"><option value="">Please choose</option>
${c.options.map((o) => `        <option>${esc(o)}</option>`).join("\n")}
      </select></div>`
  )
  .join("\n")}
${multis}
  </div>`
      : "";

  const opens = s.open.length
    ? `  <h2 class="section"><span class="n">${String(sections.length + 2).padStart(2, "0")}</span>In your own words
    <span class="hint">Optional, and usually the most useful part of the survey.</span></h2>
  <div class="card">
${s.open
  .map(
    (o) => `    <div class="field"><label class="lbl">${esc(o.label)}</label>
      <textarea name="${o.key}"></textarea></div>`
  )
  .join("\n")}
  </div>`
    : "";

  const nameField = s.anonymous
    ? ""
    : `  <div class="card">
    <div class="field"><label class="lbl"><b>Your name</b>, so we know whose view this is.</label>
      <input type="text" name="respondent" placeholder="Dr ..." /></div>
  </div>`;

  const privacyLine = s.anonymous
    ? `<strong>Your answers are anonymous.</strong> ${esc(s.intro)}`
    : `<strong>This survey is attributed.</strong> ${esc(s.intro)}`;

  const subline = `${s.anonymous ? "Anonymous" : "Attributed"} &middot; ${esc(s.minutes)}`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex,nofollow" />
<title>Belfiore &middot; ${esc(s.title)}</title>
<style>${CSS}</style>
</head>
<body>
<header class="top">
  <div class="wrap">
    <div class="eyebrow">Consult for Africa &middot; Confidential</div>
    <h1>Belfiore &middot; ${esc(s.title)}</h1>
    <p>${subline}</p>
  </div>
</header>

<div class="wrap">
  <div id="form-wrap">
    <div class="card privacy">${privacyLine}</div>
    <div class="card scalekey">
      For most questions, choose how much you agree from <b>1</b> to <b>5</b>. Every question also
      has <b>N/A &middot; Do not know</b>, and you should use it freely where a question does not
      apply to you.
    </div>
    <div class="card err" id="err"></div>

    <div class="progress">
      <div class="bar"><i id="barfill"></i></div>
      <div class="bar-t"><span id="answered">0</span> of <span id="total">0</span> answered</div>
    </div>

    <form id="form">
${nameField}

${body}

${cats}

${opens}
    </form>

    <button class="submit" id="submitBtn">Submit my answers</button>
    <p class="foot">Consult for Africa &middot; hello@consultforafrica.com &middot; consultforafrica.com</p>
  </div>

  <div class="thanks" id="thanks">
    <div class="check">&#10003;</div>
    <h2>Thank you</h2>
    <p>Your answers are in, and they genuinely make a difference to what we recommend.</p>
    <p class="foot">Consult for Africa</p>
  </div>
</div>

<script>
const ENDPOINT = ${JSON.stringify(ENDPOINT)};
const SURVEY = ${JSON.stringify(s.id)};
const form = document.getElementById("form");
const scaleItems = ${JSON.stringify(s.questions.map((q) => q.key))};

document.getElementById("total").textContent = scaleItems.length;
function updateProgress(){
  let n = 0;
  scaleItems.forEach(function(name){
    if (form.querySelector('input[name="' + name + '"]:checked')) n++;
  });
  document.getElementById("answered").textContent = n;
  document.getElementById("barfill").style.width = (n / scaleItems.length * 100) + "%";
}
form.addEventListener("change", updateProgress);

document.getElementById("submitBtn").addEventListener("click", async function(){
  const data = {};
  const multiKeys = ${JSON.stringify(s.multi.map((m) => m.key))};
  new FormData(form).forEach(function(v, k){
    if (multiKeys.indexOf(k) !== -1) { (data[k] = data[k] || []).push(v); }
    else { data[k] = v; }
  });
  const respondent = data.respondent || undefined;
  delete data.respondent;
  const answered = scaleItems.filter(function(n){ return data[n]; }).length;
  const err = document.getElementById("err");
  if (answered < scaleItems.length * 0.6) {
    err.style.display = "block";
    err.textContent = "Please answer a few more questions before submitting. Your answers are most useful when the survey is mostly complete, and N/A counts as an answer.";
    window.scrollTo({top:0,behavior:"smooth"}); return;
  }
  err.style.display = "none";
  const payload = { survey: SURVEY, respondent: respondent, submittedAt: new Date().toISOString(), responses: data };
  const btn = document.getElementById("submitBtn");
  btn.disabled = true; btn.textContent = "Submitting...";
  try {
    const r = await fetch(ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    if (!r.ok) throw new Error("bad status");
    document.getElementById("form-wrap").style.display = "none";
    document.getElementById("thanks").style.display = "block";
    window.scrollTo({top:0,behavior:"smooth"});
  } catch (e) {
    btn.disabled = false; btn.textContent = "Submit my answers";
    err.style.display = "block";
    err.textContent = "Something went wrong sending your answers. Please try again in a moment.";
  }
});
</script>
</body>
</html>
`;
}

for (const s of BELFIORE_SURVEYS) {
  const out = join(PUBLIC, s.formPath.replace(/^\//, ""));
  writeFileSync(out, build(s), "utf8");
  console.log(`wrote ${out}  (${s.questions.length} scale, ${s.categorical.length} categorical, ${s.open.length} open)`);
}
