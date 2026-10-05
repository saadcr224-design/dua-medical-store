# DUA Medical Store

Repository: https://github.com/saadcr224-design/dua-medical-store
Live app: https://dua-medical-store.saadcr224.chatgpt.site

Source snapshot: Sites commit 5c2ce067f90b6ad6d85c9f50f2703b239003cbc6.

Production runs on ChatGPT Sites with its managed D1 database. Production database records and secrets are not included here.

The built-in starter password hash and salt have been removed from this GitHub copy. A separate deployment must provision a password record in the settings table before login; existing production password settings remain on Sites. Tests using the old starter password require an explicit test password fixture.

For changes requested in the original ChatGPT conversation, update this repository and publish through Sites. A GitHub push alone does not deploy to Sites; no automatic GitHub-to-Sites deployment hook is configured.
