/* The "Get in touch" form. Messages go through Web3Forms (a free form service) to the address registered with the access key in js/data.js (formKey).
   The key is safe to publish and the address itself never appears on the site. With no key set, the form says it is not switched on yet and sends nothing. */
(function () {
  var D = window.LION || {};
  var form = document.getElementById("ctForm");
  if (!form) return;
  var phone = document.getElementById("ctPhone");
  if (phone && D.phone) phone.textContent = D.phone;
  document.querySelectorAll("main [data-book]").forEach(function (a) { a.href = D.bookingUrl || "index.html#find"; if (D.bookingUrl) a.rel = "noopener"; });
  var send = document.getElementById("ctSend"), status = document.getElementById("ctStatus");

  function say(text, ok) {
    status.textContent = text;
    status.hidden = false;
    status.className = "f__status " + (ok ? "is-ok" : "is-bad");
  }
  function flag(input, errId, bad) {
    document.getElementById(errId).hidden = !bad;
    input.setAttribute("aria-invalid", bad ? "true" : "false");
    if (bad) input.setAttribute("aria-describedby", errId); else input.removeAttribute("aria-describedby");
    return bad;
  }
  function validate() {
    var name = document.getElementById("ctName"), contact = document.getElementById("ctContact"), msg = document.getElementById("ctMsg");
    var bad = [flag(name, "ctNameE", !name.value.trim()), flag(contact, "ctContactE", !contact.value.trim()), flag(msg, "ctMsgE", !msg.value.trim())];
    var first = [name, contact, msg].filter(function (_, i) { return bad[i]; })[0];
    if (first) first.focus();
    return !first;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    status.hidden = true;
    if (!validate()) return;
    if (document.getElementById("ctBot").checked) return;  // a bot filled the hidden box
    if (!D.formKey) { say("Sorry, this form isn't switched on yet. Please ring us on " + (D.phone || "the pub") + " and we'll help.", false); return; }
    var topic = (form.querySelector("input[name=topic]:checked") || {}).value || "Enquiry";
    var contact = document.getElementById("ctContact").value.trim();
    var data = {
      access_key: D.formKey,
      subject: "Lion website enquiry: " + topic,
      from_name: "The Lion website",
      topic: topic,
      name: document.getElementById("ctName").value.trim(),
      contact: contact,
      date: document.getElementById("ctDate").value || "not given",
      people: document.getElementById("ctPeople").value || "not given",
      message: document.getElementById("ctMsg").value.trim()
    };
    if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contact)) data.email = contact;  // lets the reply button reach them
    send.disabled = true; send.textContent = "Sending...";
    fetch("https://api.web3forms.com/submit", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(data) })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (j && j.success) { form.reset(); say("Thanks, we've got your message and we'll reply as soon as we can.", true); }
        else say("Sorry, that didn't send. Please try again, or ring us on " + (D.phone || "the pub") + ".", false);
      })
      .catch(function () { say("Sorry, that didn't send. Please check your connection and try again, or ring us on " + (D.phone || "the pub") + ".", false); })
      .then(function () { send.disabled = false; send.textContent = "Send message"; });
  });
})();
