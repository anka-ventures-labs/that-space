// Bà Mối tool "{{ENDPOINT}}", rendered from discourse/tools/tool.js by
// scripts/install-discourse-ai.ts. Edit the repo copy, not the admin UI.
//
// Identity comes only from Discourse's `context`, never from the model's
// parameters. The tool secret comes from the AI secret store (alias
// ba_moi_tool_secret), so it never appears in this script.
var SERVICE_URL = "{{SERVICE_URL}}";
var ENDPOINT = "{{ENDPOINT}}";
// Parameters the model sends as comma-separated text; the service wants lists.
var LIST_PARAMS = {{LIST_PARAMS}};
var NO_ANSWER = ["none", "null", "khong nho", "không nhớ", ""];
var FALLBACK = "Bà Mối đang gặp chút trục trặc. Bạn thử lại sau ít phút nhé.";

function toArgs(params) {
  var args = {};
  Object.keys(params || {}).forEach(function (key) {
    var value = params[key];
    if (LIST_PARAMS.indexOf(key) !== -1 && typeof value === "string") {
      value = value.split(",").map(function (s) { return s.trim(); }).filter(function (s) { return s.length > 0; });
    }
    args[key] = value;
  });
  if (typeof args.birth_time === "string" && NO_ANSWER.indexOf(args.birth_time.trim().toLowerCase()) !== -1) {
    args.birth_time = null;
  }
  return args;
}

function invoke(params) {
  var auth = {
    user_id: context.user_id,
    username: context.username,
    topic_id: context.topic_id,
    post_id: context.post_id,
    private_message: context.private_message,
    // A comma-separated string in private messages, an array of usernames in chat.
    participants: Array.isArray(context.participants) ? context.participants.join(", ") : context.participants,
    channel_id: context.channel_id,
    message_id: context.message_id,
  };
  var response;
  try {
    response = http.post(SERVICE_URL + "/" + ENDPOINT, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + secrets.get("ba_moi_tool_secret"),
      },
      body: JSON.stringify({ auth: auth, args: toArgs(params) }),
    });
  } catch (e) {
    return { ok: false, error: "unreachable", message_vi: FALLBACK };
  }
  if (response.status !== 200) {
    return { ok: false, error: "http_" + response.status, message_vi: FALLBACK };
  }
  try {
    return JSON.parse(response.body);
  } catch (e) {
    return { ok: false, error: "bad_response", message_vi: FALLBACK };
  }
}

function details() {
  return "Bà Mối: " + ENDPOINT;
}
