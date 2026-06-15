import sys

with open('src/pages/ClubDashboard.tsx', 'r') as f:
    lines = f.readlines()

# Fix imports
new_lines = []
skip = False
for i, line in enumerate(lines):
    if 'getCachedClubMembers' in line and 'import' not in line:
        continue
    if 'import { getCachedAdminStatus' in line:
        new_lines.append("import { getCachedAdminStatus, preloadAdminStatus, getCachedClubMembers, preloadClubMembers, getCachedClubSettings, preloadClubSettings } from '@/lib/preloadCache';\n")
        continue
    if 'getHolders, preloadClubMembers, getCachedClubSettings, preloadClubSettings,' in line:
        continue
    new_lines.append(line)

lines = new_lines
new_lines = []

# Replace hooks
i = 0
while i < len(lines):
    line = lines[i]
    if 'useEffect(() => {' in line and i + 1 < len(lines) and 'if (!routeClubId) {' in lines[i+1]:
        # Replacing the clubNameOverride effect
        new_lines.append("  useEffect(() => {\n")
        new_lines.append("    if (!routeClubId) { setClubNameOverride(null); return; }\n")
        new_lines.append("    let cancelled = False;\n")
        new_lines.append("    setClubNameOverride(null);\n")
        new_lines.append("    const fetch = async () => {\n")
        new_lines.append("      const cached = getCachedClubSettings(routeClubId);\n")
        new_lines.append("      if (cached) setClubNameOverride(cached.name);\n")
        new_lines.append("      const data = await preloadClubSettings(routeClubId);\n")
        new_lines.append("      if (!cancelled && data) setClubNameOverride(data.name);\n")
        new_lines.append("    };\n")
        new_lines.append("    fetch();\n")
        new_lines.append("    return () => { cancelled = true; };\n")
        new_lines.append("  }, [routeClubId, activeClub?.club_id, activeClub?.club_name]);\n")
        # Skip the original effect block
        while '}, [routeClubId,' not in lines[i]:
            i += 1
        i += 1
        continue
    
    if 'const [clubDetails, setClubDetails]' in line:
        new_lines.append("  const [clubDetails, setClubDetails] = useState(clubId ? getCachedClubSettings(clubId) ?? { about: null, logo_url: null, social_instagram: null, social_linkedin: null, tagline: null } : { about: null, logo_url: null, social_instagram: null, social_linkedin: null, tagline: null });\n")
        new_lines.append("  useEffect(() => {\n")
        new_lines.append("    if (!clubId) return;\n")
        new_lines.append("    const fetch = async () => {\n")
        new_lines.append("      const cached = getCachedClubSettings(clubId);\n")
        new_lines.append("      if (cached) setClubDetails(cached);\n")
        new_lines.append("      const data = await preloadClubSettings(clubId);\n")
        new_lines.append("      if (data) setClubDetails(data);\n")
        new_lines.append("    };\n")
        new_lines.append("    fetch();\n")
        new_lines.append("  }, [clubId]);\n")
        # Skip the original clubDetails effect
        while '}, [clubId]);' not in lines[i]:
            i += 1
        i += 1
        continue

    if 'const [postHolders, setPostHolders]' in line:
        new_lines.append("  const [postHolders, setPostHolders] = useState<PostHolder[]>(() => {\n")
        new_lines.append("    if (!clubId) return [];\n")
        new_lines.append("    const cached = getCachedClubMembers(clubId);\n")
        new_lines.append("    return cached ? cached.filter((m: any) => roleOrder.includes(m.role)).sort((a: any, b: any) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role)) : [];\n")
        new_lines.append("  });\n")
        new_lines.append("  useEffect(() => {\n")
        new_lines.append("    if (!clubId) return;\n")
        new_lines.append("    const fetchPostHolders = async () => {\n")
        new_lines.append("      const cached = getCachedClubMembers(clubId);\n")
        new_lines.append("      if (cached) {\n")
        new_lines.append("        setPostHolders(cached.filter((m: any) => roleOrder.includes(m.role)).sort((a: any, b: any) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role)));\n")
        new_lines.append("      }\n")
        new_lines.append("      const data = await preloadClubMembers(clubId);\n")
        new_lines.append("      if (data) {\n")
        new_lines.append("        setPostHolders(data.filter((m: any) => roleOrder.includes(m.role)).sort((a: any, b: any) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role)));\n")
        new_lines.append("      }\n")
        new_lines.append("    };\n")
        new_lines.append("    fetchPostHolders();\n")
        new_lines.append("  }, [clubId]);\n")
        # Skip the original postHolders effect
        while '}, [clubId]);' not in lines[i]:
            i += 1
        i += 1
        continue
    
    new_lines.append(line)
    i += 1

with open('src/pages/ClubDashboard.tsx', 'w') as f:
    f.writelines(new_lines)
