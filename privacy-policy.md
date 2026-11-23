---
layout: legal
title: "Privacy Policy"
description: "How briannaimm.com and ReKanban handle information."
permalink: /privacy-policy/
---

**briannaimm.com and ReKanban (kanban.briannaimm.com)**

**Effective date:** November 23, 2026

## 1. Who This Covers and Who Runs It

This Privacy Policy explains how information is handled on the website at www.briannaimm.com (the “**Site**”) and the ReKanban application at kanban.briannaimm.com (“**ReKanban**”). Both are run by Brianna R. Imm, an individual (“**I**,” “**me**,” or “**my**”). You can reach me at **briannarimm@gmail.com**.

This policy does not cover research.briannaimm.com (ScholarSync).

The [Terms of Service](/tos/) cover governing law and other terms of use.

## 2. The Website (briannaimm.com)

- **No accounts and no forms.** The Site has no accounts and no forms that send information to me.
- **Analytics.** The Site’s own code contains no analytics. Cloudflare Web Analytics is enabled for the Site, so Cloudflare collects information about visits to the Site, such as the pages viewed and the browser and device used, and provides me with summary statistics.
- **Third parties contacted when pages load.** Pages load resources from Google Fonts, cdnjs, and jsDelivr. Each of these receives your IP address when your browser requests them.
- **Election page.** The election page embeds third-party video streams, reads a public Bluesky feed, and calls civicAPI for results. The video hosts may set their own cookies or track viewers. Your layout is saved in your own browser; nothing is sent to me.
- **Missouri results and Football Manager pages.** These save your preferences in your own browser only.
- **Hosting and delivery.** The Site is hosted on GitHub Pages and delivered through Cloudflare, which acts as its content delivery network. GitHub and Cloudflare handle requests to the Site and receive visitors’ IP addresses.
- **Cloudflare cookies.** Cloudflare sets its own cookies when you visit the Site and ReKanban. They are used for security and to protect the Services against abuse, and are set by Cloudflare, not by me.
- **External links.** Links lead to other sites with their own privacy policies.

## 3. ReKanban

### 3.1 Who Can Use It

ReKanban is invite-only. You can sign in only if the administrator listed your email address, or someone shared a board or team with that email address. ReKanban is for adults 18 and over.

### 3.2 Information From Google

ReKanban uses Google sign-in.

- **Permissions requested:** openid, email, and profile. Nothing else.
- **Received:** your Google account identifier, email address, whether the email is verified, name, and the address of your profile picture.
- **Stored:** your identifier, email, name, and picture address.
- **Not stored:** Google’s access token. It is used once at sign-in and discarded. ReKanban cannot read your Gmail, Drive, Calendar, contacts, or anything else in your Google account.
- **Purpose:** to sign you in, and to show your name and picture to you and the people you share boards with.
- **Profile pictures:** your browser fetches your picture from Google’s servers each time it is shown, so Google sees that request.

**Limited Use.** ReKanban’s use of information received from Google is limited to signing you in and showing your name and picture to you and to people you share boards with. It is not used for advertising, not sold, and not transferred to anyone except as needed to run the service. ReKanban’s use of information received from Google APIs adheres to the Google API Services User Data Policy, including the Limited Use requirements.

### 3.3 Information You Put In

- Boards, columns, cards, card descriptions, checklists, due dates, and colors.
- Categories (private to you), teams, and team membership.
- Files attached to cards, with the uploader, file name, type, and size.
- Email addresses of people you invite to a board or team.
- If you connect the assistant: the AI provider, model name, the address of any custom service, and your API key. The key is encrypted at rest and never shown again.

### 3.4 Information About People Who Are Not Users

When you invite someone, their email address is stored before they have an account. It is kept until they sign in (and the invitation becomes a membership) or the inviter removes the invitation. The administrator’s list of allowed email addresses is stored the same way.

### 3.5 Information Kept Automatically

- A sign-in session, stored as a one-way hash and valid for 30 days.
- When each card and board was last changed.

ReKanban itself does not log requests or IP addresses. The web server in front of ReKanban (Caddy) does not keep access logs. Cloudflare, which handles every request, sees and may log IP addresses.

### 3.6 Cookies and Browser Storage

| Name | Purpose                                                   | Lasts      |
|------|-----------------------------------------------------------|------------|
| rk_s | Sign-in session; needed to stay signed in                 | 30 days    |
| rk_o | Sign-in security value; needed to complete Google sign-in | 10 minutes |

Theme, motion, and sidebar preferences are kept in your browser’s storage (not cookies). They stay on your device and are not sent to the server.

ReKanban uses no analytics, advertising, or tracking cookies. All of ReKanban’s own fonts, scripts, and styles are served from ReKanban itself. Cloudflare sets its own security cookies, described in Section 2.

### 3.7 Who Else Receives Information

**Service providers.**

- **DigitalOcean** hosts the server and stores the database in its Kansas City, United States datacenter.
- **Cloudflare** provides DNS and sits in front of the site. It handles every request and sees IP addresses. Cloudflare also stores the files attached to cards, in its R2 storage service. When you open an attached file, your browser fetches it directly from Cloudflare.
- **Google** provides sign-in.
- **GitHub** stores ReKanban’s code and built images. It holds no user data.

**Other people on a board or team.** Everyone on a shared board or team can see the names and email addresses of the others on it, and all of that board’s cards and files. A board’s owner decides who is on it.

**The assistant (only if you connect an AI service).** You choose the provider and supply your own key. What is sent goes to that provider under that provider’s terms. Supported providers currently include Anthropic, OpenAI, Google Gemini, GitHub Models, any OpenAI-compatible service you name, and Ollama.

- **Asking a question** sends a summary of every board you can see: board, category, team, and column names; card titles; due dates; checklist progress; and when each card last changed. Card descriptions and files are not sent.
- **This includes boards shared with you.** That means one person’s card titles can be sent to another person’s AI provider. If you are on a shared board, other members who use the assistant may send your card titles on that board to their chosen provider.
- **Creating cards from a plan** sends the text of the plan and, when adding to an existing board, that board’s column names. It does not send the board’s cards.
- **Ollama** requests go from your browser to software on your own computer. Nothing is sent to an outside service or to ReKanban’s server.
- ReKanban does not store your questions, answers, or plan text.

**What I do not do.** I do not sell personal information. I do not share it for advertising. ReKanban does not send email.

### 3.8 Access, Download, Correction, and Deletion

All of these are self-service in Settings, under Account.

**Download.** You can download one file containing your account details, categories, teams, and every board you own with its columns, cards, descriptions, and checklists. Attached files are listed with a link to download each. Boards owned by other people are listed by name only. Your AI key is never included.

**Correction.** Your name and picture come from Google at each sign-in; correct them in your Google account. Board content can be edited by anyone with edit access.

**Deletion.** You confirm deletion by typing your account’s email address. Deletion is immediate and permanent. It removes:

- your account and its link to your Google account;
- all sign-in sessions;
- your saved AI provider settings and key;
- your categories and all board and team memberships;
- pending invitations addressed to your email;
- teams you own; and
- boards you own, with every column, card, checklist, and file on them.

Please note:

- Deleting a board you own removes it for everyone it was shared with.
- Cards and files you added to a board someone else owns stay on that board. The link to your identity is removed, but the content itself is not, so any personal information written in it remains.
- Deleted data can remain in daily database backups for up to 14 days. Attached files are not in those backups and are deleted from storage immediately.
- The site administrator cannot delete their own account while other accounts exist.

**Retention otherwise.** Board content is kept until someone deletes it or the owning account is deleted. Sessions expire after 30 days. Inactive accounts are not automatically deleted.

**Requests by email.** For anything Settings cannot do, email briannarimm@gmail.com. I will respond within 30 days.

### 3.9 Security

Connections are encrypted using HTTPS. AI keys are encrypted at rest. Files and boards are served only to people with access to that board. Attached files are kept in private storage. When you open one, ReKanban checks your access and then gives your browser a temporary link to that file that stops working after five minutes; anyone who obtains the link during those five minutes can open the file. Board content is not end-to-end encrypted, and I can technically read everything in the database. ReKanban is a personal project run by one person; I take reasonable care but cannot guarantee security.

## 4. Do Not Track

Neither the Site nor ReKanban reads Do Not Track or Global Privacy Control signals, and neither changes its behavior because of them. ReKanban does not track people across other websites or over time, runs no analytics or advertising, and loads no third-party scripts, so there is nothing for these signals to turn off.

Third parties may collect information when you use the Services:

- **On ReKanban:** Cloudflare handles requests and stores and serves attached files; Google handles sign-in and serves profile pictures; and, if you connect one, your AI provider receives what Section 3.7 describes.
- **On the Site:** Cloudflare handles requests and operates Cloudflare Web Analytics; GitHub hosts the Site; Google Fonts, cdnjs, and jsDelivr receive your IP address. The election page embeds third-party video, and those hosts may set their own cookies or track viewers across sites.

## 5. Children and Age

ReKanban is for people 18 and over. The Site is not directed to children under 13, and I do not knowingly collect information from them. If I learn that a person under 18 has a ReKanban account, I will delete it.

## 6. Where Data Is Kept; United States Only

The Site and ReKanban are intended for residents of the United States. ReKanban’s database is stored in the United States, and attached files are stored in Cloudflare’s North America region. People outside the United States should not use ReKanban.

## 7. Changes to This Policy

I will update this policy when the Services’ handling of information changes, including any change in how ReKanban uses Google user data (for example, if other sign-in providers are added). I will post the updated policy with a new effective date and place a notice on this page and on ReKanban’s sign-in page.

## 8. Contact

Questions or requests: **briannarimm@gmail.com**
