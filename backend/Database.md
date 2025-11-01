- citizens
  - email1: {name, email, phone_no, dob, address, aadhar_no, total_issue_filed, createdAt, updatedAt}
  - email2: {...}

- admins
  - email1: {email, officerName, aadhar_no, department, reports: {pending, solved, working}, createdAt, updatedAt}

- issues
  - issueId1: {id, title, description, location, imageURL, citizenEmail, jurisdiction, status, createdAt, updatedAt}
  - issueId2: {...}

- otpVerifications
  - citizens
    - email1: {otp, createdAt, expiresAt}
  - admins
    - email1: {otp, createdAt, expiresAt}