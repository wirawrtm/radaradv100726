import fs from 'fs';

const cleanForMatch = (s: any) =>
  String(s || "")
    .replace(/[\s_\-\/]/g, "")
    .toLowerCase();

const db = JSON.parse(fs.readFileSync('local_sheets_db.json', 'utf-8'));
const employeesRaw = db.employee.slice(1);
const teamProfiles = {};
employeesRaw.forEach(r => {
    teamProfiles[r[0]] = {
        name: r[0],
        email: r[1],
        position: r[3],
        upline: r[6]
    };
});

const buildDepthMap = (rootName, profiles) => {
    return {}; // mocked, just 99 for everything
};

const getDdaOfUser = (picName, rootName, teamProfiles) => {
  if (!rootName || !teamProfiles) return picName;
  const cleanPic = cleanForMatch(picName);
  const cleanRoot = cleanForMatch(rootName);
  if (!cleanPic || cleanPic === "unknown") return picName;

  const calculate = (): string => {
    let realRootName = rootName;
    const cleanRealRoot = cleanForMatch(realRootName);
    const maxThreshold = 5;
    const depths = { [cleanRoot]: 0 }; // simplified

    if ((depths[cleanPic] ?? 99) <= maxThreshold) {
      const matched = Object.keys(teamProfiles).find(
        (k) => cleanForMatch(k) === cleanPic,
      );
      return matched || picName;
    }

    let current = cleanPic;
    let visited = new Set<string>();

    while (current && current !== cleanRealRoot && current !== cleanRoot) {
      if (visited.has(current)) break;
      visited.add(current);

      const profile = Object.values(teamProfiles).find(
        (p: any) => cleanForMatch(p.name) === current,
      ) as any;

      if (!profile || !profile.upline) break;

      const parentClean = cleanForMatch(profile.upline);
      const parentDepth = depths[parentClean] ?? 99;

      if (parentDepth <= maxThreshold) {
        const matched = Object.keys(teamProfiles).find(
          (k) => cleanForMatch(k) === parentClean,
        );
        return matched || profile.upline;
      }
      current = parentClean;
    }
    return picName;
  };

  return calculate();
};

console.log(getDdaOfUser("Agus Herdianto", "Moh. Abu Amar", teamProfiles));
console.log(getDdaOfUser("Iman Bayu Samudra", "Moh. Abu Amar", teamProfiles));
