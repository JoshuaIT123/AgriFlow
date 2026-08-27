# Person 6 - DevOps + Demo + Pitch

## Responsible for
- GitHub
- Deployment
- Environment configuration
- Testing
- Documentation
- Presentation
- Demo preparation

During the hackathon: making sure the demo NEVER fails.

## Architecture notes
- Owns the repo structure and branching so all 5 other roles can work in
  parallel without conflicts (one branch/folder per person, merged in the
  integration steps).
- Owns environment config (env vars, Polar network settings, DB connection
  strings) so nothing breaks between someone's laptop and the demo machine.
- Should maintain a "known-good" demo path: a scripted sequence of actions
  (using the scenario from Person 5) that is tested repeatedly before
  presenting, plus a fallback (recorded video/screenshots) in case live
  Lightning/network fails on stage.

## Deliverables
- Repo structure + branch strategy for the 6 folders/roles.
- Deployment/run instructions (README at project root).
- Test pass of the full flow before demo day.
- Slide deck / pitch script.
- Backup plan if live demo fails.

## Handoff point
Pulls together outputs from all 5 other roles into one working, demoable
system - this role's work happens continuously but peaks at Steps 8-10
(Testing, Demo, Pitch).
