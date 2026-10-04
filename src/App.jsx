import { useMemo, useRef, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import './App.css'

const STORAGE_KEY = 'trading-journal-v2'

const initialTrades = [
	{
		id: 1,
		date: '2026-10-01',
		symbol: 'NIFTY',
		segment: 'Options',
		direction: 'CE',
		setup: 'EMA + RSI',
		strategy: 'Trend continuation',
		quantity: 50,
		entry: 158.4,
		exit: 182.6,
		stopLoss: 140,
		target: 190,
		charges: 28,
		marketCondition: 'Trending',
		timeframe: '15m',
		emotion: 'Confident',
		mistake: 'None',
		followedPlan: true,
		notes: 'Good breakout after VWAP reclaim.',
	},
	{
		id: 2,
		date: '2026-10-02',
		symbol: 'BANKNIFTY',
		segment: 'Options',
		direction: 'PE',
		setup: 'Breakout fail',
		strategy: 'Fade into range',
		quantity: 25,
		entry: 213.2,
		exit: 196.7,
		stopLoss: 220,
		target: 188,
		charges: 21,
		marketCondition: 'Range',
		timeframe: '30m',
		emotion: 'Anxious',
		mistake: 'Moved stop loss',
		followedPlan: false,
		notes: 'Pulled out early due to fear.',
	},
	{
		id: 3,
		date: '2026-10-03',
		symbol: 'NIFTY',
		segment: 'Options',
		direction: 'CE',
		setup: 'EMA + RSI',
		strategy: 'Opening range breakout',
		quantity: 40,
		entry: 146.3,
		exit: 139.4,
		stopLoss: 141.5,
		target: 156,
		charges: 18,
		marketCondition: 'Volatile',
		timeframe: '5m',
		emotion: 'Neutral',
		mistake: 'No issue',
		followedPlan: true,
		notes: 'Missed the continuation move.',
	},
	{
		id: 4,
		date: '2026-10-04',
		symbol: 'NIFTY',
		segment: 'Options',
		direction: 'PE',
		setup: 'Reversal',
		strategy: 'Demand zone fade',
		quantity: 35,
		entry: 121.8,
		exit: 146.5,
		stopLoss: 118,
		target: 155,
		charges: 22,
		marketCondition: 'Trend',
		timeframe: '15m',
		emotion: 'Confident',
		mistake: 'None',
		followedPlan: true,
		notes: 'Good reversal trade after rejection.',
	},
]

const currency = new Intl.NumberFormat('en-IN', {
	style: 'currency',
	currency: 'INR',
	maximumFractionDigits: 0,
})

const defaultForm = {
	date: '2026-10-04',
	symbol: 'NIFTY',
	segment: 'Options',
	direction: 'CE',
	setup: 'EMA + RSI',
	strategy: 'Opening range breakout',
	quantity: 50,
	entry: '',
	exit: '',
	stopLoss: '',
	target: '',
	charges: 0,
	marketCondition: 'Trending',
	timeframe: '15m',
	emotion: 'Neutral',
	mistake: 'None',
	followedPlan: true,
	notes: '',
}

function getStoredTrades() {
	const saved = localStorage.getItem(STORAGE_KEY)
	if (!saved) return initialTrades
	try {
		const parsed = JSON.parse(saved)
		return Array.isArray(parsed) && parsed.length ? parsed : initialTrades
	} catch {
		return initialTrades
	}
}

function calculateTradePnl(trade) {
	const gross = (trade.exit - trade.entry) * trade.quantity
	return gross - (trade.charges || 0)
}

function App() {
	const fileInputRef = useRef(null)
	const [trades, setTrades] = useState(() => getStoredTrades())
	const [form, setForm] = useState(defaultForm)
	const [filter, setFilter] = useState('All')
	const [activePage, setActivePage] = useState('Dashboard')
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

	const visibleTrades = useMemo(() => {
		if (filter === 'All') return trades
		return trades.filter((trade) => trade.setup === filter || trade.symbol === filter)
	}, [trades, filter])

	const metrics = useMemo(() => {
		const pnlValues = trades.map(calculateTradePnl)
		const totalTrades = pnlValues.length
		const totalPnl = pnlValues.reduce((sum, value) => sum + value, 0)
		const wins = pnlValues.filter((value) => value > 0).length
		const losses = pnlValues.filter((value) => value < 0).length
		const winRate = totalTrades ? (wins / totalTrades) * 100 : 0
		const avgTrade = totalTrades ? totalPnl / totalTrades : 0
		const avgWin = wins
			? pnlValues.filter((value) => value > 0).reduce((sum, value) => sum + value, 0) / wins
			: 0
		const avgLoss = losses
			? Math.abs(
					pnlValues
						.filter((value) => value < 0)
						.reduce((sum, value) => sum + value, 0)
			  ) / losses
			: 0
		const grossProfit = pnlValues.filter((value) => value > 0).reduce((sum, value) => sum + value, 0)
		const grossLoss = Math.abs(pnlValues.filter((value) => value < 0).reduce((sum, value) => sum + value, 0))
		const profitFactor = grossLoss ? grossProfit / grossLoss : grossProfit > 0 ? Number.POSITIVE_INFINITY : 0
		const bestTrade = pnlValues.length ? Math.max(...pnlValues) : 0
		const worstTrade = pnlValues.length ? Math.min(...pnlValues) : 0

		return {
			totalTrades,
			totalPnl,
			wins,
			losses,
			winRate,
			avgTrade,
			avgWin,
			avgLoss,
			profitFactor,
			bestTrade,
			worstTrade,
		}
	}, [trades])

	const strategySummary = useMemo(() => {
		const map = new Map()
		trades.forEach((trade) => {
			const key = trade.setup || 'Other'
			const current = map.get(key) || { trades: 0, pnl: 0 }
			map.set(key, {
				trades: current.trades + 1,
				pnl: current.pnl + calculateTradePnl(trade),
			})
		})

		return [...map.entries()]
			.map(([name, values]) => ({ name, ...values }))
			.sort((a, b) => b.pnl - a.pnl)
	}, [trades])

	const monthlyPnl = useMemo(() => {
		const map = new Map()
		trades.forEach((trade) => {
			const key = new Date(trade.date).toLocaleString('en-US', { month: 'short' })
			map.set(key, (map.get(key) || 0) + calculateTradePnl(trade))
		})

		return [...map.entries()].map(([label, value]) => ({ label, value }))
	}, [trades])

	const monthlyPnlChartData = useMemo(() => {
		const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
		const data = monthNames.map((month) => ({ month, value: 0 }))

		monthlyPnl.forEach((entry) => {
			const index = monthNames.indexOf(entry.label)
			if (index >= 0) {
				data[index].value = entry.value
			}
		})

		return data.filter((entry) => entry.value !== 0 || monthNames.includes(entry.month))
	}, [monthlyPnl])

	const monthlyPnlChartDataLeft = useMemo(() => {
		const data = [...monthlyPnlChartData]
		return data.slice(0, Math.ceil(data.length / 2))
	}, [monthlyPnlChartData])

	const monthlyPnlChartDataRight = useMemo(() => {
		const data = [...monthlyPnlChartData]
		return data.slice(Math.ceil(data.length / 2))
	}, [monthlyPnlChartData])

	const tooltipFormatter = (value) => `₹${Number(value).toLocaleString('en-IN')}`

	const renderDashboard = () => (
		<>
			<section className="kpi-grid">
				<div className="kpi-card positive">
					<div className="kpi-top">
						<span className="kpi-icon">📈</span>
						<span>Net P&L</span>
					</div>
					<strong>₹ {Math.abs(metrics.totalPnl).toLocaleString('en-IN')}</strong>
					<small className="trend positive">▲ +12.4% vs previous period</small>
				</div>

				<div className="kpi-card">
					<div className="kpi-top">
						<span className="kpi-icon">🏆</span>
						<span>Win Rate</span>
					</div>
					<strong>{metrics.winRate.toFixed(0)}%</strong>
					<small className="trend positive">18 wins / 29 trades</small>
				</div>

				<div className="kpi-card">
					<div className="kpi-top">
						<span className="kpi-icon">🔄</span>
						<span>Profit Factor</span>
					</div>
					<strong>{Number.isFinite(metrics.profitFactor) ? metrics.profitFactor.toFixed(2) : '∞'}</strong>
					<small className="trend positive">Gross profit / gross loss</small>
				</div>

				<div className="kpi-card warning">
					<div className="kpi-top">
						<span className="kpi-icon">📉</span>
						<span>Max Drawdown</span>
					</div>
					<strong>-₹{Math.abs(metrics.worstTrade).toLocaleString('en-IN')}</strong>
					<small className="trend negative">18.6% vs previous period</small>
				</div>
			</section>

			<section className="overview-grid">
				<div className="panel chart-panel chart-panel-large">
					<div className="panel-header row-between">
						<h3>Monthly P&L</h3>
						<button type="button" className="ghost-btn">P&L</button>
					</div>
					<div className="recharts-wrap">
						<ResponsiveContainer width="100%" height={220}>
							<BarChart data={monthlyPnlChartDataLeft} barCategoryGap={16}>
								<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.12)" />
								<XAxis dataKey="month" tick={{ fill: '#a8bad9', fontSize: 11 }} axisLine={false} tickLine={false} />
								<YAxis tick={{ fill: '#a8bad9', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(value) => `₹${Math.abs(value)/1000}K`} />
								<Tooltip formatter={tooltipFormatter} labelStyle={{ color: '#0b1626' }} contentStyle={{ background: '#edf5ff', border: 'none', borderRadius: 10 }} />
								<Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#34d399">
									{monthlyPnlChartDataLeft.map((entry, index) => (
										<Cell key={`${entry.month}-${index}`} fill={entry.value >= 0 ? '#34d399' : '#f87171'} />
									))}
								</Bar>
							</BarChart>
						</ResponsiveContainer>
					</div>
				</div>

				<div className="panel chart-panel chart-panel-large">
					<div className="panel-header row-between">
						<h3>Monthly P&L</h3>
						<button type="button" className="ghost-btn">P&L</button>
					</div>
					<div className="recharts-wrap">
						<ResponsiveContainer width="100%" height={220}>
							<BarChart data={monthlyPnlChartDataRight} barCategoryGap={16}>
								<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.12)" />
								<XAxis dataKey="month" tick={{ fill: '#a8bad9', fontSize: 11 }} axisLine={false} tickLine={false} />
								<YAxis tick={{ fill: '#a8bad9', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(value) => `₹${Math.abs(value)/1000}K`} />
								<Tooltip formatter={tooltipFormatter} labelStyle={{ color: '#0b1626' }} contentStyle={{ background: '#edf5ff', border: 'none', borderRadius: 10 }} />
								<Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#34d399">
									{monthlyPnlChartDataRight.map((entry, index) => (
										<Cell key={`${entry.month}-${index}`} fill={entry.value >= 0 ? '#34d399' : '#f87171'} />
									))}
								</Bar>
							</BarChart>
						</ResponsiveContainer>
					</div>
				</div>

				<aside className="panel insights-panel">
					<div className="panel-header row-between">
						<h3>Trading Insights</h3>
						<button type="button" className="text-link">View All</button>
					</div>

					<div className="insight-block">
						<div className="insight-label"><span className="mini-icon success">★</span> Best Setup</div>
						<div className="insight-copy">EMA + RSI</div>
						<div className="insight-meta">68% win rate | ₹18,450 profit</div>
					</div>

					<div className="insight-block warning-block">
						<div className="insight-label"><span className="mini-icon danger">!</span> Stop-Loss Alert</div>
						<div className="insight-copy">You moved your stop loss 11 times.</div>
						<div className="insight-meta">Avg. P&L on those trades: -₹1,240</div>
					</div>

					<div className="insight-block time-block">
						<div className="insight-label"><span className="mini-icon accent">◔</span> Time Analysis</div>
						<div className="insight-copy">Morning session (9:15 – 10:30 AM)</div>
						<div className="insight-meta">performs best with 74% win rate.</div>
					</div>
				</aside>
			</section>

			<section className="panel table-panel">
				<div className="panel-header row-between">
					<h3>Recent Trades</h3>
					<button type="button" className="text-link">View All Trades</button>
				</div>

				<div className="table-wrap">
					<table>
						<thead>
							<tr>
								<th>Date</th>
								<th>Symbol</th>
								<th>Side</th>
								<th>Entry</th>
								<th>Exit</th>
								<th>Qty</th>
								<th>P&L</th>
								<th>Strategy</th>
								<th>Followed Plan</th>
							</tr>
						</thead>
						<tbody>
							{visibleTrades.slice(0, 8).map((trade) => {
								const pnl = calculateTradePnl(trade)
								return (
									<tr key={trade.id}>
										<td>{trade.date}</td>
										<td>{trade.symbol}</td>
										<td>{trade.direction}</td>
										<td>{trade.entry}</td>
										<td>{trade.exit}</td>
										<td>{trade.quantity}</td>
										<td className={pnl >= 0 ? 'positive-text' : 'negative-text'}>{currency.format(pnl)}</td>
										<td>{trade.setup}</td>
										<td>
											<span className={`status-badge ${trade.followedPlan ? 'yes' : 'no'}`}>
												{trade.followedPlan ? 'Yes' : 'No'}
											</span>
										</td>
									</tr>
								)
							})}
						</tbody>
					</table>
				</div>
			</section>
		</>
	)

	const renderAddTrade = () => (
		<div className="panel form-panel full-page-panel">
			<div className="panel-header">
				<h3>Trade Entry</h3>
			</div>

			<form onSubmit={handleSubmit} className="trade-form">
				<div className="field-grid">
					<label>
						<span>Date</span>
						<input type="date" name="date" value={form.date} onChange={handleChange} />
					</label>
					<label>
						<span>Symbol</span>
						<input type="text" name="symbol" value={form.symbol} onChange={handleChange} />
					</label>
					<label>
						<span>Segment</span>
						<select name="segment" value={form.segment} onChange={handleChange}>
							<option>Options</option>
							<option>Stocks</option>
							<option>Futures</option>
						</select>
					</label>
					<label>
						<span>Direction</span>
						<select name="direction" value={form.direction} onChange={handleChange}>
							<option>CE</option>
							<option>PE</option>
							<option>Long</option>
							<option>Short</option>
						</select>
					</label>
					<label>
						<span>Setup</span>
						<input type="text" name="setup" value={form.setup} onChange={handleChange} />
					</label>
					<label>
						<span>Strategy</span>
						<input type="text" name="strategy" value={form.strategy} onChange={handleChange} />
					</label>
					<label>
						<span>Quantity</span>
						<input type="number" name="quantity" value={form.quantity} onChange={handleChange} />
					</label>
					<label>
						<span>Entry</span>
						<input type="number" name="entry" value={form.entry} onChange={handleChange} step="0.01" />
					</label>
					<label>
						<span>Exit</span>
						<input type="number" name="exit" value={form.exit} onChange={handleChange} step="0.01" />
					</label>
					<label>
						<span>Stop Loss</span>
						<input type="number" name="stopLoss" value={form.stopLoss} onChange={handleChange} step="0.01" />
					</label>
					<label>
						<span>Target</span>
						<input type="number" name="target" value={form.target} onChange={handleChange} step="0.01" />
					</label>
					<label>
						<span>Brokerage</span>
						<input type="number" name="charges" value={form.charges} onChange={handleChange} step="0.01" />
					</label>
					<label>
						<span>Timeframe</span>
						<select name="timeframe" value={form.timeframe} onChange={handleChange}>
							<option>5m</option>
							<option>15m</option>
							<option>30m</option>
							<option>1h</option>
						</select>
					</label>
					<label>
						<span>Market condition</span>
						<select name="marketCondition" value={form.marketCondition} onChange={handleChange}>
							<option>Trending</option>
							<option>Range</option>
							<option>Volatile</option>
						</select>
					</label>
					<label>
						<span>Emotion</span>
						<select name="emotion" value={form.emotion} onChange={handleChange}>
							<option>Neutral</option>
							<option>Confident</option>
							<option>Anxious</option>
							<option>FOMO</option>
						</select>
					</label>
					<label>
						<span>Mistake</span>
						<select name="mistake" value={form.mistake} onChange={handleChange}>
							<option>None</option>
							<option>Moved stop loss</option>
							<option>Overtrading</option>
							<option>Revenge trade</option>
						</select>
					</label>
					<label className="full-width">
						<span>Notes</span>
						<textarea name="notes" value={form.notes} onChange={handleChange} rows="4" />
					</label>
				</div>

				<label className="checkbox-row">
					<input type="checkbox" name="followedPlan" checked={form.followedPlan} onChange={handleChange} />
					<span>Followed predefined plan</span>
				</label>

				<button type="submit" className="primary-btn submit-btn">Save Trade</button>
			</form>
		</div>
	)

	const renderAllTrades = () => (
		<section className="panel trades-panel full-page-panel">
			<div className="panel-header row-between">
				<h3>Recent trades</h3>
				<div className="filter-row">
					<label className="filter-label">
						<span>Filter</span>
						<select value={filter} onChange={(event) => setFilter(event.target.value)}>
							{filterOptions.map((option) => (
								<option key={option} value={option}>{option}</option>
							))}
						</select>
					</label>
				</div>
			</div>

			<div className="table-wrap">
				<table>
					<thead>
						<tr>
							<th>Date</th>
							<th>Symbol</th>
							<th>Setup</th>
							<th>Entry</th>
							<th>Exit</th>
							<th>P&L</th>
							<th>Emotion</th>
							<th>Action</th>
						</tr>
					</thead>
					<tbody>
						{visibleTrades.map((trade) => {
							const pnl = calculateTradePnl(trade)
							return (
								<tr key={trade.id}>
									<td>{trade.date}</td>
									<td>{trade.symbol}</td>
									<td>{trade.setup}</td>
									<td>{trade.entry}</td>
									<td>{trade.exit}</td>
									<td className={pnl >= 0 ? 'positive-text' : 'negative-text'}>{currency.format(pnl)}</td>
									<td>{trade.emotion}</td>
									<td>
										<button type="button" className="delete-btn" onClick={() => handleDelete(trade.id)}>Delete</button>
									</td>
								</tr>
							)
						})}
					</tbody>
				</table>
			</div>
		</section>
	)

	const renderAnalytics = () => (
		<>
			<section className="panel charts-panel full-page-panel">
				<div className="chart-card dark-card">
					<div className="panel-header">
						<h3>Equity curve</h3>
					</div>
					<div className="equity-chart">
						{equityCurve.map((point, index) => (
							<div key={`${point.label}-${index}`} className="equity-point-wrap">
								<span className="equity-bar" style={{ height: `${Math.max(20, Math.abs(point.value) / 5)}px` }} />
								<small>{point.label}</small>
							</div>
						))}
					</div>
				</div>

				<div className="chart-card dark-card">
					<div className="panel-header">
						<h3>Monthly P&L</h3>
					</div>
					<div className="bars-chart">
						{monthlyPnl.map((month) => (
							<div key={month.label} className="bar-group">
								<span className="bar-fill" style={{ height: `${Math.max(18, Math.abs(month.value) * 1.8)}px` }} />
								<small>{month.label}</small>
							</div>
						))}
					</div>
				</div>
			</section>

			<section className="panel strategy-panel full-page-panel">
				<div className="panel-header">
					<h3>Strategy performance</h3>
				</div>
				<div className="strategy-grid">
					{strategySummary.map((item) => (
						<div key={item.name} className="strategy-card">
							<div>
								<span>{item.name}</span>
								<strong>{currency.format(item.pnl)}</strong>
							</div>
							<small>{item.trades} trades</small>
						</div>
					))}
				</div>
			</section>
		</>
	)

	const renderStrategies = () => (
		<section className="panel strategy-panel full-page-panel">
			<div className="panel-header">
				<h3>Strategy review</h3>
			</div>
			<div className="strategy-grid">
				{strategySummary.map((item) => (
					<div key={item.name} className="strategy-card large-card">
						<div>
							<span>{item.name}</span>
							<strong>{currency.format(item.pnl)}</strong>
						</div>
						<small>{item.trades} trades</small>
					</div>
				))}
			</div>
		</section>
	)

	const navItems = [
		{ label: 'Dashboard', icon: '▣' },
		{ label: 'Trades', icon: '▤' },
		{ label: 'Analytics', icon: '◫' },
		{ label: 'Strategies', icon: '◎' },
		{ label: 'Journal', icon: '◭' },
		{ label: 'Settings', icon: '⚙' },
	]

	const renderActivePage = () => {
		switch (activePage) {
			case 'Dashboard':
				return renderDashboard()
			case 'Trades':
				return renderAllTrades()
			case 'Analytics':
				return renderAnalytics()
			case 'Strategies':
				return renderStrategies()
			case 'Journal':
				return renderDashboard()
			case 'Settings':
				return renderDashboard()
			default:
				return renderDashboard()
		}
	}

	return (
		<div className="app-shell">
			<aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
				<div className="brand-wrap">
					<button
						type="button"
						className="collapse-btn"
						onClick={() => setSidebarCollapsed((value) => !value)}
						aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
					>
						{sidebarCollapsed ? '›' : '‹'}
					</button>
					<div className="brand-mark">TJ</div>
					{!sidebarCollapsed && (
						<div className="brand-copy">
							<h2>TradeJournal</h2>
							<p className="nav-title">Learn • Analyze • Improve</p>
						</div>
					)}
				</div>

				<nav className="nav-list">
					{navItems.map((item) => (
						<button
							key={item.label}
							type="button"
							className={`nav-item ${activePage === item.label ? 'active' : ''}`}
							onClick={() => setActivePage(item.label)}
							title={sidebarCollapsed ? item.label : ''}
						>
							<span className="nav-icon" aria-hidden="true">{item.icon}</span>
							{!sidebarCollapsed && <span>{item.label}</span>}
						</button>
					))}
				</nav>

				{!sidebarCollapsed && (
					<div className="sidebar-card">
						<span>Plan adherence</span>
						<strong>
							{trades.filter((trade) => trade.followedPlan).length}/
							{trades.length || 1}
						</strong>
					</div>
				)}

				{!sidebarCollapsed && (
					<div className="footer-note">
						<span className="note-icon">✦</span>
						<div>
							<strong>Better trades.</strong>
							<small>Bigger goals.</small>
						</div>
					</div>
				)}
			</aside>

			<main className="main-panel">
				<header className="topbar">
					<div className="welcome-block">
						<div className="sun-icon">☀</div>
						<div>
							<h1>Good Morning, Lalmohan!</h1>
							<p className="eyebrow">Track your trades. Learn from your mistakes. Grow as a trader.</p>
						</div>
					</div>
					<div className="header-actions">
						<div className="date-pill">📅 01 Sep 2026 – 30 Sep 2026</div>
						<div className="profile-pill">
							<span className="profile-avatar">LD</span>
							<span>Lalmohan</span>
						</div>
						<button className="primary-btn add-trade-btn" onClick={() => setActivePage('Add Trade')} type="button">+ Add Trade</button>
					</div>
				</header>

				{renderActivePage()}
			</main>
		</div>
	)
}

export default App
