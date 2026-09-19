---
title: "Transformations"
weight: 30
lede: "Name a template, and a destination receives that shape instead of Uptimer's own message."
description: "Outbound payload templates: fields, preview, and the all-samples save rule."
---

A **transformation** is a named template for what a destination receives — a PagerDuty event, your
own JSON, a line of text. Without one, a destination gets Uptimer's built-in Slack-shaped
[message](/v1.8.0/alerting/webhooks/); attaching one replaces the body.

Transformations live in **Workspace → Settings → Transformations**, and a
[destination](/v1.8.0/alerting/destinations/) picks one in its own form. **Default** there means
Uptimer's own message — the absence of a transformation, not a template called "Default".

## Writing one

The editor is three steps, in the order you work through them.

**1 · What Uptimer sends.** Three sample messages — *Problems and reminders*, *No data*,
*Recoveries* — each showing every field with a real value. Copy the placeholder from the row whose
value you want.

**2 · Template.** Write the body and put `{{ field }}` where a value goes:

```json
{
  "event": "{{ kind }}",
  "summary": "{{ summary }}",
  "source": "{{ subject }}",
  "details": "{{ error }}",
  "link": "{{ link }}"
}
```

**3 · Result.** Press **Preview** and see what came out for **all three** messages, not just the
one on screen.

## The fields

| Field | What it holds |
|---|---|
| `{{ kind }}` | `problem`, `no_data` or `recovery` |
| `{{ status }}` | the subject's condition in one word: `down`, `unknown`, `up` |
| `{{ subject }}` | the monitor or subject name |
| `{{ url }}` | the URL being checked, where there is one |
| `{{ summary }}` | the one-line summary the built-in message leads with |
| `{{ error }}` | the sender's own error text, quoted as received |
| `{{ locations }}` | the locations involved, comma-separated |
| `{{ lasted }}` | how long it had been that way |
| `{{ link }}` | the link back to the subject timeline |
| `{{ workspace }}` | the workspace's display name |
| `{{ at }}` | the moment, RFC 3339 in UTC |

A field that has no value for a given message renders empty — a recovery has no `error`, and a
Custom subject has no `url`.

## JSON is escaped for you

A template that starts with `{` or `[` is treated as **JSON**: values are escaped as they are
substituted, and the result has to parse. That is what makes a quoted error safe —
`dial tcp …: i/o timeout` arrives with its quotes intact and the document still valid. Anything
else is sent as plain text.

The content type follows the same reading: `application/json` for a JSON template,
`text/plain` otherwise. The Transformations list shows which one each will send.

## The save rule

**A transformation is stored only once it renders all three messages.** There is no force, no
override, and no "save anyway":

- Save is unavailable until a preview succeeds for every sample.
- A refusal names the sample that broke and why — `{"detail": {{ error }}}` fails on *Recoveries*,
  because a recovery has no error and the document stops parsing.
- Editing an existing one is judged the same way. A broken edit is refused and **the stored
  template is left exactly as it was**, so a template that works today cannot be replaced by one
  that fails during an outage.

Deleting a transformation is allowed while destinations use it: they fall back to Uptimer's
built-in message.

## Over the API

`/v2/notifications/transformations` does the same, including `samples` (the vocabulary) and
`preview` (the same answer without storing anything) — see the
[REST reference](/v1.8.0/reference/rest-api/#list-transformations).
