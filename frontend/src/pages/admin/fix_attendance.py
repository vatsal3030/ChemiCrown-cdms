import re

path = 'e:\\Internship_Project\\ChemiCrown-cdms\\frontend\\src\\pages\\admin\\AttendanceCalendar.jsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

replacement = """  const handleSave = async () => {
    if (Object.keys(pendingChanges).length === 0) return;
    setSaving(true);
    let successCount = 0;
    
    // Optimistic UI update
    const optimisticEmployees = employees.map(emp => {
      let atts = [...(emp.employeeProfile?.attendances || [])];
      for (const [key, status] of Object.entries(pendingChanges)) {
        const [empId, dateStr] = key.split('_');
        if (emp.id === empId) {
          const existingIdx = atts.findIndex(a => a.date.startsWith(dateStr));
          if (existingIdx >= 0) {
            atts[existingIdx] = { ...atts[existingIdx], status };
          } else {
            atts.push({ date: new Date(dateStr).toISOString(), status });
          }
        }
      }
      return {
        ...emp,
        employeeProfile: {
          ...emp.employeeProfile,
          attendances: atts
        }
      };
    });
    mutate(optimisticEmployees, false);
    
    // Process changes in parallel
    const promises = Object.entries(pendingChanges).map(async ([key, status]) => {
      const [empId, dateStr] = key.split('_');
      try {
        const res = await fetch(${import.meta.env.VITE_API_URL}/api/hr//attendance, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: Bearer  },
          body: JSON.stringify({ 
            date: new Date(dateStr).toISOString(),
            status 
          })
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.message || 'Failed to save');
        return true;
      } catch (e) {
        console.error("Failed to update attendance", e);
        return false;
      }
    });

    const results = await Promise.all(promises);
    successCount = results.filter(Boolean).length;
    
    setSaving(false);
    setPendingChanges({});
    mutate(); // Re-fetch from server to ensure state consistency
    if (successCount > 0) {
      toast.success(Saved  attendance records);
    }
    if (successCount < results.length) {
      toast.error(Failed to save  records);
    }
  };"""

content = re.sub(r'  const handleSave = async \(\) => \{.*?(?=\n  return \()', replacement + '\n', content, flags=re.DOTALL)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
