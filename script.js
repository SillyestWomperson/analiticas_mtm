const GOOGLE_APPS_SCRIPT_URL =
	"https://script.google.com/macros/s/AKfycbxLvFFjof42HO3Ai8oAx5RwgMDCKmT4zX_3FwMk7F1T1lMPvLeLAdrlB73mA9X9Q1o/exec";

const COLORS = {
	primary: "#6366f1",
	secondary: "#f59e0b",
	success: "#10b981",
	danger: "#ef4444",
	warning: "#f59e0b",
	info: "#3b82f6",
	purple: "#8b5cf6",
	pink: "#ec4899",
	indigo: "#6366f1",
	teal: "#14b8a6",
};

const CHART_COLORS = [
	COLORS.primary,
	COLORS.secondary,
	COLORS.success,
	COLORS.danger,
	COLORS.purple,
	COLORS.pink,
	COLORS.indigo,
	COLORS.teal,
];

let globalData = [];

const COLUMN_MAPPING = {
	timestamp: "Carimbo de data/hora",
	conhecimento: "Você já ouviu falar sobre Inteligência Artificial (IA)? ",
	frequencia: "Com que frequência você usa ferramentas de IA para atividades relacionadas à escola/estudo/trabalho?",
	horas: "Quantas horas por semana, em média, você estima usar ferramentas de IA para fins escolares?",
	ferramentas: "Quais ferramentas de IA você já utilizou? (Marque todas as que se aplicam)",
	confianca: "Você acredita que o uso de IA melhora seu aprendizado/trabalho escolar?",
	principios: "Quais são os principais benefícios que você vê no uso de IA na educação? ",
};

async function fetchData() {
	try {
		showLoading();
		const response = await fetch(GOOGLE_APPS_SCRIPT_URL);
		if (!response.ok) {
			throw new Error(`Erro HTTP! Status: ${response.status}`);
		}
		const data = await response.json();
		globalData = data;

		hideLoading();
		showContent();

		displayStats(data);
		createCharts(data);
		createToolsAnalysis(data);
		displayInsights(data);
		createTimeline(data);
		displayTable(data);
	} catch (error) {
		console.error("Erro ao carregar os dados:", error);
		hideLoading();
		showError();
	}
}

function showLoading() {
	document.getElementById("loading").style.display = "flex";
	document.getElementById("content").style.display = "none";
	document.getElementById("error").style.display = "none";
}

function hideLoading() {
	document.getElementById("loading").style.display = "none";
}

function showContent() {
	document.getElementById("content").style.display = "block";
}

function showError() {
	document.getElementById("error").style.display = "flex";
}

function displayStats(data) {
	const statsGrid = document.getElementById("statsGrid");
	const totalRespostas = data.length;

	const stats = [
		{
			title: "Total de Respostas",
			value: totalRespostas,
			description: "Participantes do formulário",
			icon: "fas fa-users",
			color: COLORS.primary,
			bgColor: "#6366f120",
		},
		{
			title: "Taxa de Completude",
			value: calculateCompletionRate(data) + "%",
			description: "Respostas completas",
			icon: "fas fa-check-circle",
			color: COLORS.success,
			bgColor: "#10b98120",
		},
		{
			title: "Ferramentas Únicas",
			value: countUniqueTools(data),
			description: "Diferentes ferramentas mencionadas",
			icon: "fas fa-tools",
			color: COLORS.warning,
			bgColor: "#f59e0b20",
		},
		{
			title: "Última Atualização",
			value: new Date().toLocaleDateString("pt-BR"),
			description: "Data da consulta",
			icon: "fas fa-calendar",
			color: COLORS.info,
			bgColor: "#3b82f620",
		},
	];

	statsGrid.innerHTML = stats
		.map(
			(stat) => `
        <div class="stat-card">
            <div class="stat-header">
                <div class="stat-title">${stat.title}</div>
                <div class="stat-icon" style="background: ${stat.bgColor}; color: ${stat.color};">
                    <i class="${stat.icon}"></i>
                </div>
            </div>
            <div class="stat-value">${stat.value}</div>
            <div class="stat-description">${stat.description}</div>
        </div>
    `
		)
		.join("");
}

function calculateCompletionRate(data) {
	if (data.length === 0) return 0;

	const questionFields = Object.keys(data[0]).filter((header) => header !== COLUMN_MAPPING.timestamp);
	const totalQuestionFields = questionFields.length;

	let completedResponsesCount = 0;

	data.forEach((row) => {
		let filledQuestionFields = 0;
		questionFields.forEach((field) => {
			const value = row[field];
			if (value !== null && value !== undefined && String(value).trim() !== "") {
				filledQuestionFields++;
			}
		});

		if (filledQuestionFields === totalQuestionFields) {
			completedResponsesCount++;
		}
	});

	return Math.round((completedResponsesCount / data.length) * 100);
}

function countUniqueTools(data) {
	const toolsSet = new Set();
	data.forEach((row) => {
		const tools = row[COLUMN_MAPPING.ferramentas];
		if (tools) {
			const cleanTools = tools.replace(/"/g, "");
			const toolsList = cleanTools
				.split(",")
				.map((t) => t.trim())
				.filter((t) => t !== "");
			toolsList.forEach((tool) => toolsSet.add(tool));
		}
	});
	return toolsSet.size;
}

function createCharts(data) {
	if (data.length === 0) return;

	createScaleChart(data, COLUMN_MAPPING.conhecimento, "chart1", "stats1");

	createScaleChart(data, COLUMN_MAPPING.frequencia, "chart2", "stats2");

	createScaleChart(data, COLUMN_MAPPING.horas, "chart3", "stats3");

	createScaleChart(data, COLUMN_MAPPING.confianca, "chart4", "stats4");
}

function createScaleChart(data, columnName, chartId, statsId) {
	const ctx = document.getElementById(chartId);
	if (ctx && ctx.chart) {
		ctx.chart.destroy();
	}
	if (!ctx) return;

	const values = data.map((row) => parseFloat(row[columnName])).filter((v) => !isNaN(v));

	if (values.length === 0) {
		ctx.parentElement.innerHTML =
			'<p style="text-align: center; color: var(--gray-600); padding: 1rem;">Dados não encontrados ou inválidos para este gráfico.</p>';
		return;
	}

	const stats = calculateStatistics(values);

	const statsElement = document.getElementById(statsId);
	if (statsElement) {
		statsElement.innerHTML = `
            <div class="chart-stat">
                <div class="chart-stat-value">${stats.mean}</div>
                <div>Média</div>
            </div>
            <div class="chart-stat">
                <div class="chart-stat-value">${stats.median}</div>
                <div>Mediana</div>
            </div>
            <div class="chart-stat">
                <div class="chart-stat-value">${stats.mode}</div>
                <div>Moda</div>
            </div>
        `;
	}

	const frequencies = {};
	values.forEach((value) => {
		frequencies[value] = (frequencies[value] || 0) + 1;
	});

	const labels = Object.keys(frequencies).sort((a, b) => a - b);
	const counts = labels.map((label) => frequencies[label]);
	const percentages = counts.map((count) => ((count / values.length) * 100).toFixed(1));

	ctx.chart = new Chart(ctx, {
		type: "bar",
		data: {
			labels: labels,
			datasets: [
				{
					label: "Frequência",
					data: counts,
					backgroundColor: CHART_COLORS[0] + "80",
					borderColor: CHART_COLORS[0],
					borderWidth: 2,
					borderRadius: 8,
					borderSkipped: false,
				},
			],
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: {
					display: false,
				},
				tooltip: {
					callbacks: {
						label: function (context) {
							const percentage = percentages[context.dataIndex];
							return `${context.raw} respostas (${percentage}%)`;
						},
					},
				},
			},
			scales: {
				y: {
					beginAtZero: true,
					ticks: {
						stepSize: 1,
					},
				},
			},
		},
	});
}

function calculateStatistics(values) {
	if (values.length === 0) return { mean: 0, median: 0, mode: 0 };

	const mean = (values.reduce((sum, val) => sum + val, 0) / values.length).toFixed(1);

	const sorted = [...values].sort((a, b) => a - b);
	const median =
		sorted.length % 2 === 0
			? ((sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2).toFixed(1)
			: sorted[Math.floor(sorted.length / 2)].toFixed(1);

	const frequency = {};
	values.forEach((val) => (frequency[val] = (frequency[val] || 0) + 1));
	let maxFreq = 0;
	let mode = 0;
	for (const val in frequency) {
		if (frequency[val] > maxFreq) {
			maxFreq = frequency[val];
			mode = val;
		}
	}

	return { mean, median, mode };
}

function createToolsAnalysis(data) {
	const toolsData = {};
	const toolsStats = document.getElementById("toolsStats");

	data.forEach((row) => {
		const tools = row[COLUMN_MAPPING.ferramentas];
		if (tools) {
			const cleanTools = tools.replace(/"/g, "");
			const toolsList = cleanTools
				.split(",")
				.map((t) => t.trim())
				.filter((t) => t !== "");
			toolsList.forEach((tool) => {
				if (tool) {
					toolsData[tool] = (toolsData[tool] || 0) + 1;
				}
			});
		}
	});

	const sortedTools = Object.entries(toolsData)
		.sort(([, a], [, b]) => b - a)
		.slice(0, 10);

	const ctx = document.getElementById("toolsChart");
	if (ctx && ctx.chart) {
		ctx.chart.destroy();
	}
	if (ctx) {
		ctx.chart = new Chart(ctx, {
			type: "doughnut",
			data: {
				labels: sortedTools.map(([tool]) => tool),
				datasets: [
					{
						data: sortedTools.map(([, count]) => count),
						backgroundColor: CHART_COLORS.slice(0, sortedTools.length),
						borderColor: "#ffffff",
						borderWidth: 3,
					},
				],
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						position: "bottom",
						labels: {
							padding: 20,
							usePointStyle: true,
						},
					},
					tooltip: {
						callbacks: {
							label: function (context) {
								const percentage = ((context.raw / data.length) * 100).toFixed(1);
								return `${context.label}: ${context.raw} (${percentage}%)`;
							},
						},
					},
				},
			},
		});
	}

	if (toolsStats) {
		toolsStats.innerHTML = sortedTools
			.slice(0, 5)
			.map(([tool, count]) => {
				const percentage = ((count / data.length) * 100).toFixed(1);
				return `
                <div class="tool-stat">
                    <div class="tool-name">${tool}</div>
                    <div class="tool-percentage">${percentage}%</div>
                    <div class="tool-usage">${count} menções</div>
                </div>
            `;
			})
			.join("");
	}
}

function displayInsights(data) {
	const insightsContainer = document.getElementById("principiosInsight");
	if (!insightsContainer) return;

	insightsContainer.innerHTML = "";

	const principlesTexts = data
		.map((row) => row[COLUMN_MAPPING.principios])
		.filter((text) => text && String(text).trim() !== "")
		.map((text) => String(text).replace(/"/g, ""));

	if (principlesTexts.length === 0) {
		insightsContainer.innerHTML = '<p style="color: var(--gray-600);">Nenhuma observação textual disponível.</p>';
		return;
	}

	principlesTexts.forEach((text) => {
		const p = document.createElement("p");
		p.textContent = `"${text}"`;
		insightsContainer.appendChild(p);
	});
}

function createTimeline(data) {
	const ctx = document.getElementById("timelineChart");
	if (ctx && ctx.chart) {
		ctx.chart.destroy();
	}
	if (!ctx) return;

	const dateGroups = {};
	data.forEach((row) => {
		const timestamp = row[COLUMN_MAPPING.timestamp];
		if (timestamp) {
			const date = new Date(timestamp).toLocaleDateString("pt-BR", {
				year: "numeric",
				month: "2-digit",
				day: "2-digit",
			});
			dateGroups[date] = (dateGroups[date] || 0) + 1;
		}
	});

	const dates = Object.keys(dateGroups).sort();
	const counts = dates.map((date) => dateGroups[date]);

	ctx.chart = new Chart(ctx, {
		type: "line",
		data: {
			labels: dates,
			datasets: [
				{
					label: "Respostas por Data",
					data: counts,
					borderColor: COLORS.primary,
					backgroundColor: COLORS.primary + "20",
					borderWidth: 3,
					fill: true,
					tension: 0.4,
					pointBackgroundColor: COLORS.primary,
					pointBorderColor: "#ffffff",
					pointBorderWidth: 2,
					pointRadius: 6,
				},
			],
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: {
					display: true,
				},
			},
			scales: {
				y: {
					beginAtZero: true,
					ticks: {
						stepSize: 1,
					},
				},
				x: {
					type: "category",
					labels: dates,
				},
			},
		},
	});
}

function displayTable(data) {
	const table = document.getElementById("dataTable");

	if (data.length === 0) {
		table.innerHTML = '<tr><td colspan="100%">Nenhum dado encontrado</td></tr>';
		return;
	}

	const headers = Object.keys(data[0]);

	let tableHTML = "<thead><tr>";
	headers.forEach((header) => {
		tableHTML += `<th>${header}</th>`;
	});
	tableHTML += "</tr></thead><tbody>";

	data.forEach((row, index) => {
		tableHTML += `<tr>`;
		headers.forEach((header) => {
			const value = row[header] || "";
			const cleanValue = String(value).replace(/"/g, "");
			const displayValue = cleanValue.length > 50 ? cleanValue.substring(0, 50) + "..." : cleanValue;
			tableHTML += `<td title="${cleanValue.replace(/"/g, `"`)}">${displayValue}</td>`;
		});
		tableHTML += "</tr>";
	});

	tableHTML += "</tbody>";
	table.innerHTML = tableHTML;
}

document.addEventListener("DOMContentLoaded", function () {
	const sidebar = document.getElementById("sidebar");
	const mainContent = document.getElementById("mainContent");
	const navItems = document.querySelectorAll(".nav-item");

	navItems.forEach((item) => {
		item.addEventListener("click", function (e) {
			e.preventDefault();
			navItems.forEach((nav) => nav.classList.remove("active"));
			this.classList.add("active");

			const targetId = this.getAttribute("href").substring(1);
			const targetElement = document.getElementById(targetId);
			if (targetElement) {
				targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
			}

			if (window.innerWidth <= 1024) {
				sidebar.classList.remove("active");
				mainContent.classList.remove("shifted");
			}
		});
	});

	fetchData();
});
