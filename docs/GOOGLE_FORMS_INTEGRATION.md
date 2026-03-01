# Google Forms Integration

This document describes how adoption applications are handled through Google Forms.

## Overview

Adoption applications are collected through Google Forms, providing:
- Zero-code form building with conditional logic
- Automatic email notifications to staff
- Response spreadsheet for tracking applications
- Integration options via Google Sheets API (future)

## Why Google Forms?

For the initial release, Google Forms offers several advantages:

1. **Quick Setup** - No backend development needed
2. **Reliable** - Google's infrastructure handles all submissions
3. **Familiar UX** - Most users know how to fill out Google Forms
4. **Built-in Features** - Email collection, file uploads, conditional questions
5. **Easy Management** - Staff can review in Google Sheets

## Setup Guide

### 1. Create the Google Form

1. Go to [Google Forms](https://forms.google.com)
2. Create a new form with these sections:

#### Adopter Information
- Full Name (Short answer, Required)
- Email Address (Short answer, Required, Email validation)
- Phone Number (Short answer, Required)
- Address (Paragraph)

#### Living Situation
- Housing Type (Multiple choice: House, Apartment, Condo, Other)
- Do you own or rent? (Multiple choice: Own, Rent)
- If renting, landlord allows pets? (Multiple choice: Yes, No, Not applicable)
- Yard/Outdoor space? (Multiple choice: Yes - fenced, Yes - unfenced, No)

#### Household
- Number of adults in household (Short answer)
- Number of children (Short answer)
- Ages of children (Short answer, Optional)
- Other pets (Paragraph, Optional)

#### Pet Preferences
- Animal interested in (Short answer - or link to catalog)
- Why do you want to adopt? (Paragraph)
- Experience with pets (Paragraph)

#### Agreement
- Checkbox: I agree to a home visit if required
- Checkbox: I understand adoption fees apply
- Checkbox: I will provide veterinary care

### 2. Configure Form Settings

1. **Responses** tab → **Link to Sheets** (creates tracking spreadsheet)
2. **Settings** → **Collect email addresses** → On
3. **Settings** → **Send responders a copy of their response** → On
4. **Settings** → **Edit after submit** → Off

### 3. Set Up Notifications

1. In the linked Google Sheet, go to **Tools** → **Notification rules**
2. Set up email notifications for new submissions
3. Or use Google Apps Script for custom notifications:

```javascript
function onFormSubmit(e) {
  const recipient = "adoptions@example.org";
  const subject = "New Adoption Application";
  const body = "A new application was submitted. Check the sheet for details.";
  
  MailApp.sendEmail(recipient, subject, body);
}
```

### 4. Add Form Link to Frontend

Configure the form URL in the frontend environment:

**`apps/web/.env.local`:**
```env
NEXT_PUBLIC_GOOGLE_FORM_URL=https://docs.google.com/forms/d/e/YOUR_FORM_ID/viewform
```

## Frontend Integration

Example "Apply to Adopt" button component:

```tsx
// components/AdoptButton.tsx
import React from 'react';

interface AdoptButtonProps {
  animalName?: string;
}

export function AdoptButton({ animalName }: AdoptButtonProps) {
  const baseUrl = process.env.NEXT_PUBLIC_GOOGLE_FORM_URL;
  
  // Pre-fill animal name if provided (replace with your entry ID)
  const url = animalName 
    ? `${baseUrl}?entry.YOUR_ENTRY_ID=${encodeURIComponent(animalName)}`
    : baseUrl;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
    >
      Apply to Adopt
    </a>
  );
}
```

## Staff Workflow

1. **New applications** arrive in Google Sheets automatically
2. Staff receive email notifications
3. Review application in the spreadsheet
4. Contact applicant via email/phone for follow-up
5. Schedule home visit if applicable
6. Complete adoption process offline

## Environment Variables

| Variable | Location | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_GOOGLE_FORM_URL` | `apps/web/.env.local` | Public Google Form URL |


