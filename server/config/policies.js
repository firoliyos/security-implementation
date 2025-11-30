// config/policies.js

export default {
  sensitivityLevels: ["Public", "Internal", "Confidential"],

  // Example: what roles can view what sensitivity by default (MAC mapping)
  macViewPolicy: {
    Confidential: ["HR", "Admin"],
    Internal: ["Manager", "HR", "Admin"],
    Public: ["Employee", "Manager", "HR", "Admin"]
  },

  // RuBAC example: working hours (24h format)
  workingHours: { start: "09:00", end: "18:00" },

  // Example ABAC policies (could be rules compiled from UI)
  abacPolicies: [
    // manager of department can approve department leaves within hours
    {
      id: "finance_manager_approve",
      when: { role: "Manager", department: "Finance" },
      allow: ["approve_leave"]
    }
  ]
};
