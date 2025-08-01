const comp = Array.from({ length: 20000 }, (_, i) => ({
  id: i + 1,
  name: `Company ${String.fromCharCode(65 + (i % 26))}${
    Math.floor(i / 26) + 1
  }`,
}));

const emp = Array.from({ length: 100000 }, (_, i) => ({
  id: i + 1,
  comp: Math.ceil(Math.random() * comp.length),
}));

// console.log(JSON.stringify(emp.slice(0, 5), null, 2));
// console.log(JSON.stringify(comp.slice(0, 5), null, 2));
console.log(`Total Employees: ${emp.length}`);
console.log(`Total Companies: ${comp.length}`);
let countStep = 0;

// Approach with Array find
console.time("Mapping Time");
const result = emp.map((e) => {
  const company = comp.find((c) => {
    countStep++;
    return c.id === e.comp;
  });
  countStep++;
  return {
    ...e,
    companyName: company ? company.name : "Unknown Company",
  };
});
console.timeEnd("Mapping Time");

// Approach with Object Mapping
// console.time("Mapping with Object Time");
// const compMap = {};
// comp.forEach((c) => {
//   countStep++;
//   compMap[c.id] = c.name;
// });

// const result = emp.map((e) => {
//   countStep++;
//   return {
//     ...e,
//     companyName: compMap[e.comp] || "Unknown Company",
//   };
// });
// console.timeEnd("Mapping with Object Time");

// Show the first 1 results
console.log(JSON.stringify(result.slice(0, 1), null, 2));
console.log("Count Steps:", countStep);
