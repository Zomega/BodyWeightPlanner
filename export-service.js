/**
 * Handles CSV data generation and download.
 */
export const ExportService = {
  downloadCSV(results, isMetric, isCalories) {
    if (!results || !results.trajectory) return;
    const { trajectory, upperTraj, lowerTraj } = results;

    const wUnit = isMetric ? 'kg' : 'lbs';
    const eUnit = isCalories ? 'cals' : 'kj';
    const eMult = isCalories ? 1 : 4.184;

    let csv = 'sep=,\r\n';
    csv += `Day,Weight (${wUnit}),Upper Weight (${wUnit}),Lower Weight (${wUnit}),Body Fat %,BMI,Fat Mass (${wUnit}),Lean Mass (${wUnit}),Intake (${eUnit}),Expenditure (${eUnit})\r\n`;

    trajectory.forEach((row, i) => {
      const upper = upperTraj[i].weight;
      const lower = lowerTraj[i].weight;
      const mult = isMetric ? 1 : 2.20462;

      csv +=
        `${row.day},` +
        `${(row.weight * mult).toFixed(2)},` +
        `${(upper * mult).toFixed(2)},` +
        `${(lower * mult).toFixed(2)},` +
        `${row.fatPercent.toFixed(2)},` +
        `${row.bmi.toFixed(2)},` +
        `${(row.fat * mult).toFixed(2)},` +
        `${(row.lean * mult).toFixed(2)},` +
        `${Math.round(row.calories * eMult)},` +
        `${Math.round(row.tee * eMult)}
`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'BWS_Data.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};
