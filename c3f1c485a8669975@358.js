function _1(md){return(
md`# Crise sanitaire des forêts françaises  
**Quand la récolte de bois devient une récolte de crise**
`
)}

function _workbook(FileAttachment){return(
d3.csv("Récolte_de_bois_par_région_de_provenance_en_2023.csv"))}

function _sheet(workbook){return(
workbook.sheet(0, { headers: true })
)}

function _regionData(sheet){return(
sheet
  .filter(d => d["Récolte"] && d["Récolte"] !== "France" && !isNaN(+d["GrumesTotal"]))
  .map(d => {
    let nom = d["Récolte"].trim()
    let grumes_feu = +d["GrumesFeuillus"] || 0
    let grumes_con = +d["GrumesConifères"] || 0
    let total_grumes = +d["GrumesTotal"] || 0
    let total_recolte = +d["Total récolte"] || 0

    return {
      nom,
      grumes_feu,
      grumes_con,
      total_grumes,
      total_recolte,
      pct_con: total_grumes > 0 ? Math.round((grumes_con / total_grumes) * 1000) / 10 : 0
    }
  })
)}

async function _5(d3,regionData,Plot,width)
{
  let franceRegions = await d3.json("https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/regions-version-simplifiee.geojson")

  let dataMap = new Map(regionData.map(d => [d.nom, d]))

  return Plot.plot({
    width: width,
    height: Math.min(720, width * 0.72),

    projection: {
      type: "mercator",
      domain: franceRegions,
      inset: 15
    },

    color: {
      type: "linear",
      scheme: "oranges",
      label: "% grumes conifères (proxy intensité crise)",
      legend: true,
      legendPosition: "bottom",
      ticks: 5
    },

    marks: [
      Plot.geo(franceRegions, {
        fill: d => {
          let reg = dataMap.get(d.properties.nom)
          return reg ? reg.pct_con : "#e0e0e0"
        },
        stroke: "#333",
        strokeWidth: 0.8,
        title: d => {
          let reg = dataMap.get(d.properties.nom)
          if (!reg) return d.properties.nom
          return `${d.properties.nom}\n${reg.pct_con.toFixed(1)} % conifères\n${reg.total_grumes.toLocaleString("fr-FR")} mill. m³ grumes\n${reg.total_recolte.toLocaleString("fr-FR")} mill. m³ récolte totale`
        }
      }),

      // TOUS les labels, sans filtre de taille
      Plot.text(franceRegions.features, Plot.centroid({
        text: d => d.properties.nom.replace(/-/g, " "),  // remplace - par espace pour lisibilité
        fill: "#000",
        stroke: "#fff",
        strokeWidth: 4.5,               // contour blanc plus épais
        fontWeight: "bold",
        fontSize: 10,                   // un peu plus petit pour éviter chevauchements
        dy: 4,                          // léger décalage vertical
        textAnchor: "middle"
      }))
    ],

    style: { 
      background: "#f8f9fa", 
      padding: "20px 0",
      fontFamily: "system-ui, sans-serif"
    }
  })
}


function _6(md){return(
md`C’est l’introduction géographique parfaite : on voit immédiatement que la crise (scolytes surtout sur épicéa/sapin) n’est pas uniforme → elle se concentre dans les régions riches en résineux (Sud-Est, Sud-Ouest, massifs montagneux).
Ça prépare très bien les visus suivantes (essences touchées, évolution temporelle, scieries, flux du bois sanitaire).`
)}

function _selectedRegion(Inputs,regionData){return(
Inputs.select(
  ["Toutes les régions", ...regionData.map(d => d.nom)],
  { label: "Sélectionner une région pour voir son exposition", value: "Toutes les régions" }
)
)}

function _8(md){return(
md`## Visualisation 2
`
)}

function _accidentalsWorkbook(FileAttachment){return(
FileAttachment("Produits_accidentels_en_(millier_de_m3_ronds_sur_écorce).xlsx").xlsx()
)}

function _sheet1(accidentalsWorkbook){return(
accidentalsWorkbook.sheet(0, { headers: true })
)}

function _essenceRows(sheet1){return(
sheet1.filter(row => [
  "Épicéa", "Sapin", "Hêtre", "Feuillus précieux", "Chêne",
  "Pin maritime", "Douglas", "Peuplier"
].includes(row.LIBELLE))
)}

function _essenceData(essenceRows){return(
essenceRows.map(row => {
  let total = 0
  switch(row.LIBELLE) {
    case "Épicéa":            total = 3925; break
    case "Sapin":             total = 3029; break
    case "Hêtre":             total = 857;  break
    case "Feuillus précieux": total = 304;  break
    case "Chêne":             total = 2155; break
    case "Pin maritime":      total = 2831; break
    case "Douglas":           total = 2728; break
    case "Peuplier":          total = 1214; break
  }

  let acc = +row["Produits accidentels"] || 0
  let san = +row["Produits sanitaires"]  || 0

  return {
    essence: row.LIBELLE,
    total: total,
    accidentels: acc,
    sanitaires: san,
    pct_acc:   total > 0 ? (acc / total) * 100 : 0,
    pct_san:   total > 0 ? (san / total) * 100 : 0,
    pct_saine: total > 0 ? 100 - (acc / total * 100) - (san / total * 100) : 100
  }
})
)}

function _13(essenceData){return(
essenceData.sort((a, b) => (b.pct_acc + b.pct_san) - (a.pct_acc + a.pct_san))
)}

function _14(essenceData){return(
essenceData.map(d => ({
  essence: d.essence,
  saine: d.pct_saine.toFixed(1),
  acc: d.pct_acc.toFixed(1),
  san: d.pct_san.toFixed(1),
  somme: (d.pct_saine + d.pct_acc + d.pct_san).toFixed(1)
}))
)}

function _15(Plot,width,essenceData){return(
Plot.plot({
  width: width,
  height: 480,
  marginBottom: 100,
  marginLeft: 60,
  marginTop: 20,

  x: {
    label: "Essence",
    tickRotate: -35,
    tickPadding: 10
  },

  y: {
    label: "% de la récolte 2023",
    percent: true,
    grid: true,
    domain: [0, 100]                    
  },

  color: {
    domain: ["Saine", "Accidentels", "Sanitaires"],
    range: ["#a3d977", "#ffcc80", "#ff6666"],
    legend: true,
    legendPosition: "bottom"
  },

  marks: [
    Plot.barY(
      essenceData.flatMap(d => [
        {essence: d.essence, type: "Saine", value: d.pct_saine/100},
        {essence: d.essence, type: "Accidentels", value: d.pct_acc/100},
        {essence: d.essence, type: "Sanitaires", value: d.pct_san/100}
      ]),
      {
        x: "essence",
        y: "value",
        fill: "type",
        stack: "y",                     // empilage par groupe essence + type
        title: d => `${d.essence} - ${d.type}: ${d.value.toFixed(1)} %`
      }
    )
  ]
})
)}

function _16(md){return(
md`Il présente, pour l'année 2023 et au niveau national (France métropolitaine), la répartition de la récolte de bois par essence principale en trois catégories :

Saine (vert clair) : bois récolté sans problème majeur (ni accident, ni maladie/insecte)
Accidentels (orange clair) : bois issu de coupes accidentelles (tempêtes, chablis, dégâts mécaniques…)
Sanitaires (rouge) : bois issu de coupes sanitaires (attaques d'insectes comme les scolytes, dépérissement lié à la sécheresse, maladies…)

Chaque barre représente 100 % de la récolte de cette essence en 2023. Les essences sont triées de gauche à droite par ordre décroissant de la part « crise » (accidentels + sanitaires cumulés).`
)}

function _17(md){return(
md`## Visualisation 3
`
)}

function _RecolteWorkbook(FileAttachment){return(
FileAttachment("Récolte_de_bois.xlsx").xlsx()
)}

function _sheet2(RecolteWorkbook){return(
RecolteWorkbook.sheet(0, { headers: true })
)}

function _categories(){return(
[
    "Bois d'œuvre",
    "Bois d'industrie",
    "Bois énergie",
    "Récolte de bois commercialisé"   
  ]
)}

function _detailBoisOeuvre(){return(
[
  { essence: "Chêne",               2018: 2392, 2019: 2332, 2020: 2164, 2021: 2152, 2022: 2271, 2023: 2155 },
  { essence: "Hêtre",               2018: 1042, 2019: 936,  2020: 837,  2021: 895,  2022: 928,  2023: 857  },
  { essence: "Feuillus précieux",   2018: 252,  2019: 274,  2020: 224,  2021: 242,  2022: 257,  2023: 304  },
  { essence: "Peuplier",            2018: 1456, 2019: 1450, 2020: 1281, 2021: 1419, 2022: 1491, 2023: 1214 },
  { essence: "Pin maritime",        2018: 3601, 2019: 3203, 2020: 2607, 2021: 3079, 2022: 3204, 2023: 2831 },
  { essence: "Sapin",               2018: 6664, 2019: 3377, 2020: 2184, 2021: 2919, 2022: 2981, 2023: 3029 },
  { essence: "Épicéa",              2018: null, 2019: 3420, 2020: 4620, 2021: 5359, 2022: 4327, 2023: 3925 },
  { essence: "Douglas",             2018: 2919, 2019: 2967, 2020: 3131, 2021: 3179, 2022: 2834, 2023: 2728 }
]
)}

function _detailBoisIndustrie(){return(
[
  { essence: "Feuillus (trituration)", 2018: 4133, 2019: 4049, 2020: 3796, 2021: 3724, 2022: 3851, 2023: 3640 },
  { essence: "Conifères (trituration)", 2018: 5451, 2019: 5806, 2020: 5680, 2021: 5744, 2022: 5810, 2023: 5978 },
  { essence: "Autres bois d'industrie", 2018: 756,  2019: 678,  2020: 546,  2021: 657,  2022: 650,  2023: 645  }
]
)}

function _detailBoisEnergie(){return(
[
  { essence: "Bois ronds > 2 m",         2018: 1947, 2019: 1836, 2020: 2023, 2021: 1873, 2022: 1993, 2023: 2090 },
  { essence: "Bois en rondins et bûches < 2 m", 2018: 3863, 2019: 3529, 2020: 3047, 2021: 3602, 2022: 3828, 2023: 3891 },
  { essence: "Plaquettes forestières",   2018: 2702, 2019: 2696, 2020: 3064, 2021: 3420, 2022: 3790, 2023: 4383 }
]
)}

function _categoriesDetails(detailBoisOeuvre,detailBoisIndustrie,detailBoisEnergie){return(
{
  "Bois d'œuvre": detailBoisOeuvre,
  "Bois d'industrie": detailBoisIndustrie,
  "Bois énergie": detailBoisEnergie
}
)}

function _macroData(){return(
[]
)}

function _26(sheet2,categories,macroData){return(
sheet2.forEach(row => {
    const lib = (row.LIBELLE || "").trim()
    
    if (categories.includes(lib)) {
      const entry = { catégorie: lib }
      
      for (let year = 2018; year <= 2023; year++) {
        const col = year.toString()
        const val = row[col]
        if (val !== undefined && val !== "" && !isNaN(Number(val))) {
          entry[year] = Number(val)
        }
      }
      
      macroData.push(entry)
    }
  })
)}

function _27(macroData){return(
macroData.sort((a, b) => {
    const ordre = ["Bois d'œuvre", "Bois d'industrie", "Bois énergie", "Récolte de bois commercialisé"]
    return ordre.indexOf(a.catégorie) - ordre.indexOf(b.catégorie)
  })
)}

function _longMacro(macroData){return(
macroData.flatMap(d => {
  return [2018,2019,2020,2021,2022,2023].map(year => ({
    catégorie: d.catégorie,
    year: year,
    volume: d[year] ?? null
  }))
}).filter(d => d.volume !== null)
)}

function _29(Plot,width,longMacro){return(
Plot.plot({
  width: width,
  height: 520,
  marginBottom: 80,
  marginLeft: 70,
  marginTop: 30,
  
  x: {
    label: "Année",
    tickFormat: d => d,
    domain: [2018, 2023]
  },
  
  y: {
    label: "Volume récolté (milliers m³)",
    grid: true,
    domain:[0,50000]
  },
  
  color: {
    domain: ["Bois d'œuvre", "Bois d'industrie", "Bois énergie", "Récolte de bois commercialisé"],
    range: ["#1f77b4", "#ff7f0e", "#2ca02c", "#9467bd"],  // bleu, orange, vert, violet
    legend: true,
    legendPosition: "bottom"
  },
  
  marks: [
    // Aires empilées pour les 3 catégories + total en contour
    Plot.areaY(longMacro.filter(d => d.catégorie !== "Récolte de bois commercialisé"), Plot.stackY({
      x: "year",
      y: "volume",
      fill: "catégorie",
      opacity: 0.85
    })),
    
    // Contour noir du total récolté (pour bien voir la somme)
    Plot.line(longMacro.filter(d => d.catégorie === "Récolte de bois commercialisé"), {
      x: "year",
      y: "volume",
      stroke: "black",
      strokeWidth: 3,
      curve: "linear",
      title: "Total récolté"
    }),
    
    // Annotation sur la tendance 2023
    Plot.text([{year: 2023, volume: 20000}], {
      text: "Bois énergie en hausse\npour absorber la crise sanitaire",
      fill: "#2ca02c",
      fontWeight: "bold",
      textAnchor: "end",
      dy: -15,
      lineHeight: 1.4
    }),
    
    Plot.text([{year: 2023, volume: 19000}], {
      text: "Bois d'œuvre en baisse (-7,3 %)",
      fill: "#d62728",
      fontWeight: "bold",
      textAnchor: "end",
      dy: 20
    })
  ]
})
)}

function _selection(html,d3,longMacro)
{
  const node = html`<div></div>`;
  node.value = "Bois d'œuvre"; // valeur par défaut

  const categories = ["Bois d'œuvre", "Bois d'industrie", "Bois énergie"];
  const colors = d3.scaleOrdinal()
    .domain(categories)
    .range(["#1f77b4", "#ff7f0e", "#2ca02c"]);

  const margin = { top: 20, right: 20, bottom: 40, left: 70 };
  const width = 900 - margin.left - margin.right;  // largeur graphique
  const height = 500 - margin.top - margin.bottom; // hauteur graphique

  // Préparer les données pour stack
  const years = Array.from(new Set(longMacro.map(d => d.year)));
  const stackData = years.map(y => {
    const obj = { year: y };
    longMacro.filter(d => d.year === y && d.catégorie !== "Récolte de bois commercialisé")
      .forEach(d => obj[d.catégorie] = d.volume);
    return obj;
  });

  const stack = d3.stack().keys(categories)(stackData);

  // Scale X : collé à l’axe Y
  const x = d3.scaleBand()
    .domain(years)
    .range([0, width])
    .padding(0.1)
    .align(0);

  const y = d3.scaleLinear()
    .domain([0, d3.max(stack[stack.length - 1], d => d[1])])
    .nice()
    .range([height, 0]);

  // Aire normale
  const area = d3.area()
    .x(d => x(d.data.year) + x.bandwidth() / 2)
    .y0(d => y(d[0]))
    .y1(d => y(d[1]));

  // Aire agrandie pour survol
  const areaHover = d3.area()
    .x(d => x(d.data.year) + x.bandwidth() / 2)
    .y0(d => y(d[0]) - 3)
    .y1(d => y(d[1]) + 3);

  const svg = d3.create("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .style("font", "10px sans-serif");

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Aires empilées avec survol et clic
  g.selectAll("path")
    .data(stack)
    .join("path")
    .attr("fill", d => colors(d.key))
    .attr("d", area)
    .style("cursor", "pointer")
    .on("click", (event, d) => {
      node.value = d.key;
      node.dispatchEvent(new CustomEvent("input", { bubbles: true }));
      console.log("Clic sur :", d.key);
    })
    .on("mouseover", function(event, d) {
      d3.select(this)
        .transition()
        .duration(100)
        .attr("d", areaHover(d));
    })
    .on("mouseout", function(event, d) {
      d3.select(this)
        .transition()
        .duration(100)
        .attr("d", area(d));
    });

  // Axe X collé + ticks corrects
  g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x)
            .tickValues(years)
            .tickFormat(d3.format("d")));

  // Axe Y
  g.append("g")
    .call(d3.axisLeft(y));

  node.appendChild(svg.node());
  return node;
}


function _detailChart(categoriesDetails,selection,html,d3)
{
  const data = categoriesDetails[selection];

  const years = [2018, 2019, 2020, 2021, 2022, 2023];

  // Transformation au format long
  const formattedData = [];
  data.forEach(d => {
    years.forEach(y => {
      formattedData.push({
        essence: d.essence,
        year: y,
        volume: d[y] || 0
      });
    });
  });

  const node = html`<div></div>`;

  const essences = Array.from(new Set(formattedData.map(d => d.essence)));
  const colors = d3.scaleOrdinal()
    .domain(essences)
    .range(d3.schemeTableau10);

  const margin = { top: 30, right: 150, bottom: 50, left: 70 }; // plus de marge droite pour la légende
  const width = 900 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  // Préparer données pour stack
  const stackData = years.map(y => {
    const obj = { year: y };
    formattedData.filter(d => d.year === y)
      .forEach(d => obj[d.essence] = d.volume);
    return obj;
  });

  const stack = d3.stack()
    .keys(essences)
    (stackData);

  const x = d3.scaleBand()
    .domain(years)
    .range([0, width])
    .padding(0.1)
    .align(0);

  const y = d3.scaleLinear()
    .domain([0, d3.max(stack[stack.length - 1], d => d[1])])
    .nice()
    .range([height, 0]);

  const area = d3.area()
    .x(d => x(d.data.year) + x.bandwidth() / 2)
    .y0(d => y(d[0]))
    .y1(d => y(d[1]));

  const areaHover = d3.area()
    .x(d => x(d.data.year) + x.bandwidth() / 2)
    .y0(d => y(d[0]) - 3)
    .y1(d => y(d[1]) + 3);

  const svg = d3.create("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .style("font", "10px sans-serif");

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Aires empilées par essence
  g.selectAll("path")
    .data(stack)
    .join("path")
    .attr("fill", d => colors(d.key))
    .attr("d", area)
    .style("cursor", "pointer")
    .on("mouseover", function(event, d) {
      d3.select(this)
        .transition()
        .duration(100)
        .attr("d", areaHover(d));
    })
    .on("mouseout", function(event, d) {
      d3.select(this)
        .transition()
        .duration(100)
        .attr("d", area(d));
    })
    .append("title") // info-bulle comme Plot
    .text(d => d.key);

  // Axe X
  g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickValues(years).tickFormat(d3.format("d")));

  // Axe Y
  g.append("g")
    .call(d3.axisLeft(y).ticks(6));

  // Titre
  svg.append("text")
    .attr("x", (width + margin.left + margin.right)/2)
    .attr("y", margin.top / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .style("font-weight", "bold")
    .text(`Détail : ${selection}`);

  // Sous-titre
  svg.append("text")
    .attr("x", (width + margin.left + margin.right)/2)
    .attr("y", margin.top / 2 + 16)
    .attr("text-anchor", "middle")
    .style("font-size", "11px")
    .text("Répartition par essence ou type (milliers m³)");

  // --- LÉGENDE ---
  const legend = svg.append("g")
    .attr("transform", `translate(${width + margin.left + 20},${margin.top})`);

  essences.forEach((essence, i) => {
    const gLegend = legend.append("g")
      .attr("transform", `translate(0, ${i * 20})`);

    gLegend.append("rect")
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", colors(essence));

    gLegend.append("text")
      .attr("x", 20)
      .attr("y", 12)
      .text(essence)
      .style("font-size", "10px")
      .attr("alignment-baseline", "middle");
  });

  node.appendChild(svg.node());
  return node;
}


function _32(selection){return(
selection
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["Récolte_de_bois_ par_région_de_provenance_en_2023.xlsx", {url: new URL("./files/83ff98de0964474a56f514a2a3f2bdc2c289d30b073dda59922b0bcb009c9550f4e4bf4d5bbf97dc6233cda82314206ac80cd6e2f76bca8dfb891c27c341f5f4.xlsx", import.meta.url), mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", toString}],
    ["Produits_accidentels_en_(millier_de_m3_ronds_sur_écorce).xlsx", {url: new URL("./files/f242e43e245725442ae2ab2ac61a961f5d8cf37045d1c54cae85d31bc7ceac38507324a72661538fa86a4c1a0db51a7017aa257456a0aa3de40946bbc7b530df.xlsx", import.meta.url), mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", toString}],
    ["Récolte_de_bois.xlsx", {url: new URL("./files/7dc417b5bd69d1f6908e5514aefe12c38e677e14533d5e8c614c9e3a92c67e04859deecd88c962397dbd7830aab48463cb8ac19200e7e33ab5d27d54691455e9.xlsx", import.meta.url), mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer("workbook")).define("workbook", ["FileAttachment"], _workbook);
  main.variable(observer("sheet")).define("sheet", ["workbook"], _sheet);
  main.variable(observer("regionData")).define("regionData", ["sheet"], _regionData);
  main.variable(observer()).define(["d3","regionData","Plot","width"], _5);
  main.variable(observer()).define(["md"], _6);
  main.variable(observer("viewof selectedRegion")).define("viewof selectedRegion", ["Inputs","regionData"], _selectedRegion);
  main.variable(observer("selectedRegion")).define("selectedRegion", ["Generators", "viewof selectedRegion"], (G, _) => G.input(_));
  main.variable(observer()).define(["md"], _8);
  main.variable(observer("accidentalsWorkbook")).define("accidentalsWorkbook", ["FileAttachment"], _accidentalsWorkbook);
  main.variable(observer("sheet1")).define("sheet1", ["accidentalsWorkbook"], _sheet1);
  main.variable(observer("essenceRows")).define("essenceRows", ["sheet1"], _essenceRows);
  main.variable(observer("essenceData")).define("essenceData", ["essenceRows"], _essenceData);
  main.variable(observer()).define(["essenceData"], _13);
  main.variable(observer()).define(["essenceData"], _14);
  main.variable(observer()).define(["Plot","width","essenceData"], _15);
  main.variable(observer()).define(["md"], _16);
  main.variable(observer()).define(["md"], _17);
  main.variable(observer("RecolteWorkbook")).define("RecolteWorkbook", ["FileAttachment"], _RecolteWorkbook);
  main.variable(observer("sheet2")).define("sheet2", ["RecolteWorkbook"], _sheet2);
  main.variable(observer("categories")).define("categories", _categories);
  main.variable(observer("detailBoisOeuvre")).define("detailBoisOeuvre", _detailBoisOeuvre);
  main.variable(observer("detailBoisIndustrie")).define("detailBoisIndustrie", _detailBoisIndustrie);
  main.variable(observer("detailBoisEnergie")).define("detailBoisEnergie", _detailBoisEnergie);
  main.variable(observer("categoriesDetails")).define("categoriesDetails", ["detailBoisOeuvre","detailBoisIndustrie","detailBoisEnergie"], _categoriesDetails);
  main.variable(observer("macroData")).define("macroData", _macroData);
  main.variable(observer()).define(["sheet2","categories","macroData"], _26);
  main.variable(observer()).define(["macroData"], _27);
  main.variable(observer("longMacro")).define("longMacro", ["macroData"], _longMacro);
  main.variable(observer()).define(["Plot","width","longMacro"], _29);
  main.variable(observer("viewof selection")).define("viewof selection", ["html","d3","longMacro"], _selection);
  main.variable(observer("selection")).define("selection", ["Generators", "viewof selection"], (G, _) => G.input(_));
  main.variable(observer("detailChart")).define("detailChart", ["categoriesDetails","selection","html","d3"], _detailChart);
  main.variable(observer()).define(["selection"], _32);
  return main;
}
