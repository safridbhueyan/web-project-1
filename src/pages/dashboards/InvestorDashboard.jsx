import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import StatusBadge from '../../components/ui/StatusBadge';
import TraceabilityView from '../../components/ui/TraceabilityView';
import { getInvestmentsByInvestor } from '../../services/investmentService';
import { getActivePackages } from '../../services/packageService';
import { getTransactionsByUser } from '../../services/transactionService';
import { useAuth } from '../../hooks/useAuth';
import { formatBDT } from '../../utils/formatters';
import { Briefcase, TrendingUp, DollarSign, PackageOpen } from 'lucide-react';

const SEED_INVESTMENTS = [
  { id: 'I1', packageId: 'Broiler Batch 500', amount: 50000, expectedROI: 12, currentROI: 8, status: 'active', endDate: '2026-06-15' },
  { id: 'I2', packageId: 'Cattle Fattening', amount: 150000, expectedROI: 18, currentROI: 15, status: 'active', endDate: '2026-12-01' },
];

const SEED_TRANSACTIONS = [
  { id: 'T1', type: 'deposit', amount: 200000, status: 'completed', date: '2026-03-01' },
  { id: 'T2', type: 'payout', amount: 50000, status: 'completed', date: '2026-03-15' },
];

const DEMO_TRACE = {
  investor: { name: 'Demo Investor', id: 'INV-001' },
  package: { name: 'Broiler Batch 500', type: 'Chicken' },
  livestock: { type: 'Broiler Chicken', quantity: 500, status: 'active' },
  farmer: { name: 'Ali Khan', id: 'f1' },
  fso: { name: 'David FSO', id: 'fso1' },
};

const InvestorDashboard = () => {
  const { user } = useAuth();
  const [investments, setInvestments] = useState(SEED_INVESTMENTS);
  const [transactions, setTransactions] = useState(SEED_TRANSACTIONS);
  const [availablePackages, setAvailablePackages] = useState(2);

  useEffect(() => {
    (async () => {
      if (!user?.uid) return;
      try {
        const [inv, pkgs, txs] = await Promise.all([
          getInvestmentsByInvestor(user.uid),
          getActivePackages(),
          getTransactionsByUser(user.uid),
        ]);
        setInvestments(inv || []);
        setAvailablePackages(pkgs?.length || 0);
        setTransactions(txs || []);
      } catch (error) {
        console.error('Error fetching investor data:', error);
      }
    })();
  }, [user]);

  const totalInvested = investments.reduce((s, i) => s + Number(i.amount || 0), 0);
  const estReturns = investments.reduce((s, i) => s + Number(i.amount || 0) * Number(i.expectedROI || 0) / 100, 0);

  const walletBalance = transactions
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => t.type === 'payout' ? sum + t.amount : sum - t.amount, 0);

  const columns = [
    { header: 'Investment ID', accessor: 'id' },
    { header: 'Package', accessor: 'packageId' },
    { header: 'Amount', accessor: 'amount', render: (v) => formatBDT(v) },
    { header: 'Est. ROI', accessor: 'expectedROI', render: (v) => `${v}%` },
    { header: 'Current ROI', accessor: 'currentROI', render: (v) => <span style={{ color: '#16a34a', fontWeight: 600 }}>{v}%</span> },
    { header: 'Status', accessor: 'status', render: (v) => <StatusBadge status={v} /> },
    { header: 'End Date', accessor: 'endDate', render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
  ];

  return (
    <DashboardLayout>
      <div className="dashboard-header" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1 style={{ fontSize: '2rem', color: 'var(--text-primary)', marginBottom: 'var(--spacing-xs)' }}>
          Investor Portfolio
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Track your assets, ROIs, and find new opportunities.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-xl)' }}>
        <Card variant="stat" title="Total Invested" value={formatBDT(totalInvested)} icon={Briefcase} />
        <Card variant="stat" title="Est. Returns" value={formatBDT(Math.round(estReturns))} icon={TrendingUp} trend={{ value: totalInvested > 0 ? Math.round(estReturns / totalInvested * 100) : 0, isPositive: true }} />
        <Card variant="stat" title="Wallet Balance" value={formatBDT(walletBalance)} icon={DollarSign} />
        <Card variant="stat" title="Available Packages" value={String(availablePackages)} icon={PackageOpen} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--spacing-lg)' }}>
        <Card title="Your Active Investments">
          <Table columns={columns} data={investments} searchable pageSize={8} />
        </Card>

        <Card title="Investment Traceability — Sample">
          <p style={{ padding: '0 var(--spacing-lg)', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-sm)' }}>
            Track the full chain of your investment from purchase to livestock to farmer.
          </p>
          <TraceabilityView data={DEMO_TRACE} />
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default InvestorDashboard;
