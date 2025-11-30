// utils/emailTemplates.js

export const leaveRequestTemplate = (employeeName, type, start, end) => `
  <h2>New Leave Request</h2>
  <p><strong>${employeeName}</strong> has requested <strong>${type}</strong> leave.</p>
  <p>From: ${start}</p>
  <p>To: ${end}</p>
`;

export const leaveApprovedTemplate = (name, type) => `
  <h2>Leave Approved</h2>
  <p>Hi ${name}, your <strong>${type}</strong> leave request has been <strong>APPROVED</strong>.</p>
`;

export const leaveRejectedTemplate = (name, type) => `
  <h2>Leave Rejected</h2>
  <p>Hi ${name}, unfortunately your <strong>${type}</strong> leave request has been <strong>REJECTED</strong>.</p>
`;

export const suspiciousLoginTemplate = (ip, device) => `
  <h2>Suspicious Login Attempt</h2>
  <p>A login attempt was detected:</p>
  <p>IP: ${ip}</p>
  <p>Device: ${device}</p>
`;
