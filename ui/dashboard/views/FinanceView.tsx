import { useState } from "react";
import { PanResponder, Pressable, StyleSheet, View } from "react-native";
import {
  Button,
  Card,
  Divider,
  IconButton,
  ProgressBar,
  Surface,
  Text,
} from "react-native-paper";
import type { AchievementLedger } from "@/game/achievements";
import type { FacilityCollection } from "@/game/facilities";
import {
  ECONOMY_INTEREST_MULTIPLIERS,
  ECONOMY_PHASE_SCORES,
  FINANCE_REPORT_PERIODS,
  LENDER_TYPE_LABELS,
  LENDER_TYPES,
  LOAN_TERMS,
  type Finance,
  type LoanOffer,
  type LoanSearchCriteria,
} from "@/game/finance";
import {
  buildFinanceStatementData,
  calculate52CycleLoanCostRate,
  calculateLoanSearchEstimate,
  estimatePrepaymentPenalty,
  estimateRemainingLoanInterest,
} from "@/game/finance";
import type { Inventory } from "@/game/inventory";
import type { Market } from "@/game/market";
import type { ResearchLedger } from "@/game/research";
import { getResource } from "@/game/resources";
import { colors } from "@/theme";
import { formatCurrency, formatElapsedTime, formatNumber, getColorClass, normalizeToUnitInterval } from "@/utils";
import { SectionHeading } from "@/ui/dashboard/components/DashboardPrimitives";
import { useFinanceStatementData } from "./finance/useFinanceStatementData";

type Page = "summary" | "assets" | "liabilities" | "cash-flow" | "funding";
type StatementData = ReturnType<typeof buildFinanceStatementData>;
type Props = {
  achievements: AchievementLedger;
  companyStartedAtGameTimeMs: number;
  currentGameTimeMs: number;
  facilities: FacilityCollection;
  finance: Finance;
  inventory: Inventory;
  market: Market;
  onAcceptLoanOffer: (offer: LoanOffer) => boolean;
  onExtraPayment: (loanId: string) => { success: boolean; reason?: string };
  onRemoveLoanOffer: (offerId: string) => boolean;
  onRemoveUnavailableLoanOffers: () => number;
  onRepayInFull: (loanId: string) => { success: boolean; reason?: string };
  onStartLoanSearch: (criteria: LoanSearchCriteria) => {
    success: boolean;
    reason?: string;
  };
  research: ResearchLedger;
};

export function FinanceView(props: Props) {
  const [page, setPage] = useState<Page>("summary");
  const [period, setPeriod] =
    useState<(typeof FINANCE_REPORT_PERIODS)[number]["id"]>("all-time");
  const [cashFlowGroupMs, setCashFlowGroupMs] = useState(60_000);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const [expandedDetails, setExpandedDetails] = useState<ReadonlySet<string>>(new Set());
  const [searching, setSearching] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<
    readonly (typeof LENDER_TYPES)[number][]
  >([]);
  const [amountMin, setAmountMin] = useState(10);
  const [amountMax, setAmountMax] = useState(1_000_000);
  const [termMin, setTermMin] = useState(5);
  const [termMax, setTermMax] = useState(1_440);
  const [offerCount, setOfferCount] = useState(3);
  const [message, setMessage] = useState<string | null>(null);
  const data = useFinanceStatementData({
        achievements: props.achievements,
        cashFlowGroupDurationMs: cashFlowGroupMs,
        companyStartedAtGameTimeMs: props.companyStartedAtGameTimeMs,
        currentGameTimeMs: props.currentGameTimeMs,
        facilities: props.facilities,
        finance: props.finance,
        inventory: props.inventory,
        market: props.market,
        period,
        research: props.research,
      });
  const criteria: LoanSearchCriteria = {
    lenderTypes: selectedTypes,
    amountMin,
    amountMax,
    durationMinPeriods: termMin,
    durationMaxPeriods: termMax,
    offerCount,
  };
  const searchEstimate = calculateLoanSearchEstimate(
    criteria,
    LENDER_TYPES.length,
  );
  const toggle = (id: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const toggleDetail = (id: string) =>
    setExpandedDetails((current) => {
      const next = new Set(current);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  return (
    <View style={s.screen}>
      <SectionHeading
        eyebrow="FINANCE"
        title="Company finance"
        subtitle="Statements, cash movement, debt, lender eligibility, and funding."
      />
      <Nav page={page} setPage={setPage} />
      {page !== "funding" && (
        <PeriodPicker period={period} setPeriod={setPeriod} />
      )}
      {page === "summary" && <Summary data={data} />}
      {page === "assets" && <Assets data={data} />}
      {page === "liabilities" && (
        <Liabilities currentGameTimeMs={props.currentGameTimeMs} data={data} />
      )}
      {page === "cash-flow" && (
        <CashFlow
          companyStartedAtGameTimeMs={props.companyStartedAtGameTimeMs}
          data={data}
          expanded={expanded}
          expandedDetails={expandedDetails}
          groupMs={cashFlowGroupMs}
          setGroupMs={setCashFlowGroupMs}
          toggle={toggle}
          toggleDetail={toggleDetail}
        />
      )}
      {page === "funding" && (
        <LoanSearchOutcome result={props.finance.getLastLoanSearchResult()} />
      )}
      {page === "funding" && (
        <Funding
          activeSearch={props.finance.getActiveLoanSearch()}
          data={data}
          estimate={searchEstimate}
          message={message}
          offers={props.finance.getLoanSearchOffers()}
          searching={searching}
          selectedTypes={selectedTypes}
          amountMin={amountMin}
          amountMax={amountMax}
          termMin={termMin}
          termMax={termMax}
          offerCount={offerCount}
          setSearching={setSearching}
          setSelectedTypes={setSelectedTypes}
          setAmountMin={setAmountMin}
          setAmountMax={setAmountMax}
          setTermMin={setTermMin}
          setTermMax={setTermMax}
          setOfferCount={setOfferCount}
          onSearch={() => {
            const result = props.onStartLoanSearch(criteria);
            setMessage(
              result.success
                ? "Lender search started. Keep the game active while it completes."
                : (result.reason ?? "Search could not be started."),
            );
            if (result.success) setSearching(false);
          }}
          onAccept={(offer) =>
            setMessage(
              props.onAcceptLoanOffer(offer)
                ? `${offer.lenderName} loan accepted. Remaining quotes were rechecked.`
                : "The offer is no longer eligible.",
            )
          }
          onClearOffer={(offer) =>
            setMessage(
              props.onRemoveLoanOffer(offer.id)
                ? `${offer.lenderName} offer removed.`
                : "The offer was already removed.",
            )
          }
          onClearUnavailable={() => {
            const removed = props.onRemoveUnavailableLoanOffers();
            setMessage(
              removed > 0
                ? `${removed} unavailable ${removed === 1 ? "offer was" : "offers were"} removed.`
                : "There are no unavailable offers to remove.",
            );
          }}
          onExtra={(id) => {
            const result = props.onExtraPayment(id);
            setMessage(
              result.success
                ? "Extra payment accepted."
                : (result.reason ?? "Payment failed."),
            );
          }}
          onRepay={(id) => {
            const result = props.onRepayInFull(id);
            setMessage(
              result.success
                ? "Loan repaid in full."
                : (result.reason ?? "Repayment failed."),
            );
          }}
        />
      )}
    </View>
  );
}

function Nav({ page, setPage }: { page: Page; setPage: (page: Page) => void }) {
  return (
    <View style={s.nav}>
      {(
        [
          ["summary", "Summary"],
          ["assets", "Assets"],
          ["liabilities", "Loans"],
          ["cash-flow", "Cash flow"],
          ["funding", "Funding"],
        ] as const
      ).map(([id, label]) => (
        <Pressable
          key={id}
          onPress={() => setPage(id)}
          style={[s.tab, page === id && s.tabActive]}
        >
          <Text style={[s.tabLabel, page === id && s.tabLabelActive]}>
            {label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
function PeriodPicker({
  period,
  setPeriod,
}: {
  period: (typeof FINANCE_REPORT_PERIODS)[number]["id"];
  setPeriod: (period: (typeof FINANCE_REPORT_PERIODS)[number]["id"]) => void;
}) {
  return (
    <View style={s.choices}>
      {FINANCE_REPORT_PERIODS.map((option) => (
        <Button
          compact
          key={option.id}
          mode={period === option.id ? "contained" : "outlined"}
          onPress={() => setPeriod(option.id)}
        >
          {option.label}
        </Button>
      ))}
    </View>
  );
}
function Row({
  label,
  value,
  negative = false,
  strong = false,
  valueColor,
}: {
  label: string;
  value: string;
  negative?: boolean;
  strong?: boolean;
  valueColor?: string;
}) {
  return (
    <View style={s.row}>
      <Text style={strong ? s.strong : undefined}>{label}</Text>
      <Text style={[strong ? s.strong : s.value, negative && s.negative, valueColor ? { color: valueColor } : undefined]}>
        {value}
      </Text>
    </View>
  );
}

/** Lower borrowing rates are better, so this inverts the normalized rate score. */
function getLoanRateColor(periodicRate: number): string {
  return getColorClass(1 - normalizeToUnitInterval(periodicRate, LOAN_TERMS.minAnnualRate / 52, LOAN_TERMS.maxAnnualRate / 52));
}

function Panel({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <Card mode="contained">
      <Card.Content style={s.card}>
        <Text style={s.kicker}>{title}</Text>
        {children}
      </Card.Content>
    </Card>
  );
}
function LoanSearchOutcome({
  result,
}: {
  result: ReturnType<Finance["getLastLoanSearchResult"]>;
}) {
  if (!result) return null;
  const available = result.availableOfferCount;
  return (
    <Panel title="LATEST SEARCH">
      <Row
        label="Requested / found"
        value={`${result.requestedOfferCount} / ${result.foundOfferCount}`}
      />
      <Row label="Available now" strong value={`${available}`} />
      <Text style={available > 0 ? s.hint : s.negative}>
        {available > 0
          ? `${available} offer${available === 1 ? "" : "s"} can be accepted now.`
          : "No offers matched your current borrowing limit or search criteria. Build company assets or improve credit, then search again."}
      </Text>
    </Panel>
  );
}
function Breakdown({
  title,
  rows,
}: {
  title: string;
  rows: readonly { label: string; amount: number }[];
}) {
  return (
    <Panel title={title}>
      {rows.length === 0 ? (
        <Text style={s.hint}>Nothing recorded in this period.</Text>
      ) : (
        rows.map((row) => (
          <Row
            key={row.label}
            label={row.label}
            value={formatCurrency(row.amount)}
          />
        ))
      )}
    </Panel>
  );
}
function Summary({ data }: { data: StatementData }) {
  const { incomeStatement, assets, liabilitiesEquity } = data;
  return (
    <View style={s.content}>
      <Panel title="INCOME STATEMENT">
        <Row label="Income" value={formatCurrency(incomeStatement.income)} />
        <Row
          label="Expenses"
          negative
          value={formatCurrency(incomeStatement.expenses)}
        />
        <Divider />
        <Row
          label="Net income"
          negative={incomeStatement.netIncome < 0}
          strong
          value={formatCurrency(incomeStatement.netIncome)}
        />
      </Panel>
      <Panel title="BALANCE SHEET SUMMARY">
        <Row label="Assets" value={formatCurrency(assets.totalAssets)} />
        <Row
          label="Liabilities"
          negative
          value={formatCurrency(liabilitiesEquity.totalLiabilities)}
        />
        <Divider />
        <Row
          label="Equity"
          strong
          value={formatCurrency(liabilitiesEquity.totalEquity)}
        />
      </Panel>
      <Breakdown title="INCOME DETAIL" rows={incomeStatement.incomeDetails} />
      <Breakdown title="EXPENSE DETAIL" rows={incomeStatement.expenseDetails} />
    </View>
  );
}
function Assets({ data }: { data: StatementData }) {
  const { assets } = data;
  return (
    <View style={s.content}>
      <Panel title="ASSETS">
        <Row label="Cash" value={formatCurrency(assets.cash)} />
        <Row
          label="Inventory at local prices"
          value={formatCurrency(assets.inventory)}
        />
        <Row
          label="Condition-adjusted facilities"
          value={formatCurrency(assets.facilities)}
        />
        <Text style={s.hint}>
          Facility value uses land, materials at local prices, upgrades, and
          present condition.
        </Text>
        <Row
          label="Capitalized research"
          value={formatCurrency(assets.research)}
        />
        <Divider />
        <Row
          label="Total assets"
          strong
          value={formatCurrency(assets.totalAssets)}
        />
      </Panel>
    </View>
  );
}
function Liabilities({
  currentGameTimeMs,
  data,
}: {
  currentGameTimeMs: number;
  data: StatementData;
}) {
  const { liabilitiesEquity, creditRating, loanLimitBreakdown, economyPhase } =
    data;
  const b = creditRating.breakdown;
  const ageContribution =
    Math.sqrt(Math.min(1, b.companyStability.companyAgeHours / 240)) * 0.35;
  const consistencyContribution = b.companyStability.profitConsistency * 0.4;
  const efficiencyContribution = b.companyStability.expenseEfficiency * 0.25;
  return (
    <View style={s.content}>
      <Panel title="ACTIVE LOANS">
        <View style={s.choices}>
          <Badge
            label={`Credit ${creditRating.grade} (${Math.round(creditRating.score * 100)})`}
          />
          <Badge label={`Economy: ${economyPhase}`} />
          <Badge
            label={`Loan limit: ${formatCurrency(loanLimitBreakdown.availableBorrowingLimit)}`}
          />
        </View>
        {liabilitiesEquity.loans.length === 0 ? (
          <Text style={s.hint}>No active debt.</Text>
        ) : (
          liabilitiesEquity.loans.map((loan) => {
            const remainingInterest = estimateRemainingLoanInterest(loan);
            return (
              <Surface elevation={0} key={loan.id} style={s.loan}>
                <Text variant="titleSmall">{loan.lenderName}</Text>
                <Text style={s.hint}>
                  {LENDER_TYPE_LABELS[loan.lenderType]} · {loan.status}
                </Text>
                <Row
                  label="Original principal"
                  value={formatCurrency(loan.principal)}
                />
                <Row
                  label="52-cycle loan cost"
                  strong
                  value={formatNumber(
                    calculate52CycleLoanCostRate(
                      loan.principal,
                      loan.paymentAmount,
                      loan.totalPeriods,
                      loan.originationFee,
                    ),
                    { percent: true, decimals: 1 },
                  )}
                />
                <Row
                  label="Interest rate per cycle"
                  value={formatNumber(loan.periodicInterestRate, {
                    percent: true,
                    decimals: 3,
                  })}
                  valueColor={getLoanRateColor(loan.periodicInterestRate)}
                />
                <Row
                  label="Payment per cycle"
                  value={formatCurrency(loan.paymentAmount)}
                />
                <Row
                  label="Payments remaining"
                  value={`${loan.remainingPeriods} · ${formatTerm(loan.remainingPeriods)}`}
                />
                <Row
                  label="Interest remaining"
                  value={formatCurrency(remainingInterest)}
                />
                <Row
                  label="Total remaining repayment"
                  negative
                  value={formatCurrency(
                    loan.remainingBalance + remainingInterest,
                  )}
                />
                <Text style={s.hint}>
                  52-cycle loan cost includes the origination fee. One payment
                  cycle is one foreground minute.
                </Text>
                <Row
                  label="Next payment"
                  value={formatElapsedTime(
                    Math.max(
                      0,
                      loan.nextPaymentAtGameTimeMs - currentGameTimeMs,
                    ),
                  )}
                />
                <Row
                  label="Warnings"
                  negative={loan.missedPayments > 0}
                  value={
                    loan.missedPayments > 0
                      ? `${loan.missedPayments} missed`
                      : "None"
                  }
                />
              </Surface>
            );
          })
        )}
        <Divider />
        <Row
          label="Total liabilities"
          negative
          value={formatCurrency(liabilitiesEquity.totalLiabilities)}
        />
        <Row
          label="Total equity"
          strong
          value={formatCurrency(liabilitiesEquity.totalEquity)}
        />
      </Panel>
      <Panel title="CREDIT RATING BREAKDOWN">
        <Row
          label="Asset strength"
          value={formatNumber(b.assetHealth.score, { percent: true })}
          valueColor={getColorClass(b.assetHealth.score)}
        />
        <Row
          label="Debt to assets"
          value={formatNumber(b.assetHealth.debtToAssetRatio, {
            percent: true,
          })}
        />
        <Row
          label="Asset coverage"
          value={`${formatNumber(b.assetHealth.assetCoverage, { decimals: 1 })}×`}
        />
        <Row
          label="Payment history"
          value={formatNumber(b.paymentHistory.score, { percent: true })}
          valueColor={getColorClass(b.paymentHistory.score)}
        />
        <Row
          label="On-time / missed"
          value={`${b.paymentHistory.onTimePayments} / ${b.paymentHistory.missedPayments}`}
        />
        <Row
          label="Company stability"
          value={formatNumber(b.companyStability.score, { percent: true })}
          valueColor={getColorClass(b.companyStability.score)}
        />
        <Row
          label="Age / consistency / efficiency"
          value={`${formatNumber(ageContribution, { percent: true })} / ${formatNumber(consistencyContribution, { percent: true })} / ${formatNumber(efficiencyContribution, { percent: true })}`}
        />
        <Row
          label="Final rating"
          strong
          value={`${creditRating.grade} (${formatNumber(creditRating.score, { percent: true })})`}
          valueColor={getColorClass(creditRating.score)}
        />
      </Panel>
      <LenderAvailability breakdown={loanLimitBreakdown} />
    </View>
  );
}
function Badge({ color = colors.primary, label }: { color?: string; label: string }) {
  return <Text style={[s.badge, { color }]}>{label}</Text>;
}
function LenderAvailability({
  breakdown,
}: {
  breakdown: StatementData["loanLimitBreakdown"];
}) {
  const [expandedLenderId, setExpandedLenderId] = useState<string | null>(null);
  return (
    <Panel title="LENDER AVAILABILITY">
      <Text style={s.hint}>
        Borrowing available = company ceiling − outstanding debt.
      </Text>
      <Row
        label="Company ceiling"
        value={formatCurrency(breakdown.grossBorrowingLimit)}
      />
      <Row
        label="Outstanding debt"
        negative
        value={formatCurrency(breakdown.outstandingBalance)}
      />
      <Row
        label="Borrowing available"
        strong
        value={formatCurrency(breakdown.availableBorrowingLimit)}
      />
      {breakdown.lenderBreakdowns.map((lender) => {
        const caps = [
          { label: "Asset cap", amount: lender.assetCap },
          { label: "Rating cap", amount: lender.ratingCap },
          { label: "Market cap", amount: lender.marketCapLimit },
          { label: "Contract cap", amount: lender.lenderContractLimit },
        ];
        const bottleneck = caps.reduce((lowest, cap) =>
          cap.amount < lowest.amount ? cap : lowest,
        );
        const expanded = expandedLenderId === lender.lenderId;
        return (
          <Pressable
            accessibilityLabel={`${expanded ? "Hide" : "Show"} ${lender.lenderName} lending limits`}
            accessibilityRole="button"
            accessibilityState={{ expanded }}
            key={lender.lenderId}
            onPress={() =>
              setExpandedLenderId((current) =>
                current === lender.lenderId ? null : lender.lenderId,
              )
            }
          >
            <Surface elevation={0} style={s.loan}>
              <View style={s.loanHeader}>
                <Text variant="titleSmall">{lender.lenderName}</Text>
                <Text style={lender.isAvailable ? s.available : s.negative}>
                  {lender.isAvailable ? "Eligible" : "Not eligible"}
                </Text>
              </View>
              <Text style={s.hint}>
                {lender.isAvailable
                  ? `Can lend up to ${formatCurrency(lender.availableLimit)} now.`
                  : lender.unavailableReason}
              </Text>
              {expanded && (
                <View style={s.details}>
                  <Row
                    label="Current bottleneck"
                    strong
                    value={bottleneck.label}
                  />
                  <Row
                    label="Asset cap"
                    value={formatCurrency(lender.assetCap)}
                  />
                  <Row
                    label="Rating cap"
                    value={formatCurrency(lender.ratingCap)}
                  />
                  <Row
                    label="Market cap"
                    value={formatCurrency(lender.marketCapLimit)}
                  />
                  <Row
                    label="Contract cap"
                    value={formatCurrency(lender.lenderContractLimit)}
                  />
                  <Row
                    label="Policy cap"
                    strong
                    value={formatCurrency(lender.policyCap)}
                  />
                  <Row
                    label="Available now"
                    strong
                    value={formatCurrency(lender.availableLimit)}
                  />
                </View>
              )}
              <Text style={s.hint}>
                {expanded
                  ? "Tap to hide lending limits."
                  : "Tap to show lending limits."}
              </Text>
            </Surface>
          </Pressable>
        );
      })}
    </Panel>
  );
}
function CashFlow({
  companyStartedAtGameTimeMs,
  data,
  expanded,
  expandedDetails,
  groupMs,
  setGroupMs,
  toggle,
  toggleDetail,
}: {
  companyStartedAtGameTimeMs: number;
  data: StatementData;
  expanded: ReadonlySet<string>;
  expandedDetails: ReadonlySet<string>;
  groupMs: number;
  setGroupMs: (value: number) => void;
  toggle: (id: string) => void;
  toggleDetail: (id: string) => void;
}) {
  return (
    <View style={s.content}>
      <View style={s.choices}>
        <Button
          compact
          mode={groupMs === 60_000 ? "contained" : "outlined"}
          onPress={() => setGroupMs(60_000)}
        >
          1 min groups
        </Button>
        <Button
          compact
          mode={groupMs === 15 * 60_000 ? "contained" : "outlined"}
          onPress={() => setGroupMs(15 * 60_000)}
        >
          15 min groups
        </Button>
      </View>
      {data.cashFlowRows.length === 0 ? (
        <Surface elevation={0} style={s.empty}>
          <Text>No transactions in this period.</Text>
        </Surface>
      ) : (
        data.cashFlowRows.map((row) => (
          <View key={row.id} style={s.cash}>
          <Pressable
            accessibilityLabel={`${expanded.has(row.id) ? "Hide" : "Show"} ${row.description} details`}
            accessibilityRole="button"
            accessibilityState={{ expanded: expanded.has(row.id) }}
            onPress={() => toggle(row.id)}
          >
            <View style={s.row}>
              <View style={s.cashName}>
                <Text variant="bodyLarge">{row.description}</Text>
                <Text style={s.hint}>
                  {formatElapsedTime(
                    Math.max(0, row.atGameTimeMs - companyStartedAtGameTimeMs),
                  )}{" "}
                  · {row.type} ·{" "}
                  {expanded.has(row.id) ? "Hide details" : "Show details"}
                </Text>
              </View>
              <Text style={row.amount < 0 ? s.negative : s.available}>
                {formatCurrency(row.amount)}
              </Text>
            </View>
          </Pressable>
            {expanded.has(row.id) && (
              <View style={s.details}>
                {row.detailGroups.map((group) => {
                  const transactionCount = group.details.reduce(
                    (total, detail) => total + detail.count,
                    0,
                  );
                  return (
                    <View key={group.id} style={s.group}>
                      <Row
                        label={`${group.label} ×${transactionCount}`}
                        negative={group.amount < 0}
                        value={formatCurrency(group.amount)}
                      />
                      {group.details.map((detail) => {
                        const totalQuantity = detail.totalQuantity ?? 0;
                        const totalAbsoluteAmount = detail.totalAbsoluteAmount ?? 0;
                        const totalQualityQuantity = detail.totalQualityQuantity ?? 0;
                        const totalQualityAmount = detail.totalQualityAmount ?? 0;
                        const hasMarketTotals = totalQuantity > 0 && totalAbsoluteAmount > 0;
                        const hasQualityTotals = totalQualityQuantity > 0 && totalQualityAmount > 0;
                        return (
                          <View key={detail.id} style={s.detailStack}>
                            <Text accessibilityRole="button" accessibilityState={{ expanded: expandedDetails.has(detail.id) }} onPress={() => toggleDetail(detail.id)}>
                              <Text style={s.detail}>
                                • {detail.resourceType ? `${getResource(detail.resourceType).icon} ` : ""}{detail.description}
                                {detail.count > 1 ? ` ×${detail.count}` : ""}
                              </Text>
                            </Text>
                            {expandedDetails.has(detail.id) ? hasMarketTotals ? (
                              <>
                                <Text style={s.detailSubline}>
                                  Total quantity:{" "}
                                  {formatNumber(totalQuantity, {
                                    smartDecimals: true,
                                  })}
                                </Text>
                                <Text style={s.detailSubline}>
                                  Average unit price:{" "}
                                  {formatCurrency(totalAbsoluteAmount / totalQuantity)}
                                </Text>
                                {hasQualityTotals && (
                                  <Text style={s.detailSubline}>
                                    Average quality: Q
                                    {formatNumber(totalQualityAmount / totalQualityQuantity, { decimals: 2, forceDecimals: true })}
                                  </Text>
                                )}
                              </>
                            ) : (
                              detail.detailLines.map((line, index) => (
                                <Text
                                  key={`${detail.id}-${index}`}
                                  style={s.detailSubline}
                                >
                                  {line}
                                </Text>
                              ))
                            ) : null}
                          </View>
                        );
                      })}
                    </View>
                  );
                })}
              </View>
            )}
            <Text style={s.hint}>
              Balance after: {formatCurrency(row.balance)}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}
function Funding({
  activeSearch,
  amountMax,
  amountMin,
  data,
  estimate,
  message,
  offerCount,
  offers,
  onAccept,
  onClearOffer,
  onClearUnavailable,
  onExtra,
  onRepay,
  onSearch,
  searching,
  selectedTypes,
  setAmountMax,
  setAmountMin,
  setOfferCount,
  setSearching,
  setSelectedTypes,
  setTermMax,
  setTermMin,
  termMax,
  termMin,
}: {
  activeSearch: ReturnType<Finance["getActiveLoanSearch"]>;
  amountMax: number;
  amountMin: number;
  data: StatementData;
  estimate: ReturnType<typeof calculateLoanSearchEstimate>;
  message: string | null;
  offerCount: number;
  offers: readonly LoanOffer[];
  onAccept: (offer: LoanOffer) => void;
  onClearOffer: (offer: LoanOffer) => void;
  onClearUnavailable: () => void;
  onExtra: (loanId: string) => void;
  onRepay: (loanId: string) => void;
  onSearch: () => void;
  searching: boolean;
  selectedTypes: readonly (typeof LENDER_TYPES)[number][];
  setAmountMax: (value: number) => void;
  setAmountMin: (value: number) => void;
  setOfferCount: (value: number) => void;
  setSearching: (value: boolean) => void;
  setSelectedTypes: (value: readonly (typeof LENDER_TYPES)[number][]) => void;
  setTermMax: (value: number) => void;
  setTermMin: (value: number) => void;
  termMax: number;
  termMin: number;
}) {
  const activeLoans = data.liabilitiesEquity.loans.filter(
    (loan) => loan.status === "active",
  );
  const economyRateChange = ECONOMY_INTEREST_MULTIPLIERS[data.economyPhase] - 1;
  const economyRateLabel = `${economyRateChange >= 0 ? "+" : ""}${formatNumber(economyRateChange, { percent: true, decimals: 0 })}`;
  return (
    <View style={s.content}>
      <Panel title="ACTIVE LOAN ACTIONS">
        {activeLoans.length === 0 ? (
          <Text style={s.hint}>No active loans.</Text>
        ) : (
          activeLoans.map((loan) => (
            <Surface elevation={0} key={loan.id} style={s.loan}>
              <Text variant="titleSmall">{loan.lenderName}</Text>
              <Row label="52-cycle loan cost" strong value={formatNumber(calculate52CycleLoanCostRate(loan.principal, loan.paymentAmount, loan.totalPeriods, loan.originationFee), { percent: true, decimals: 1 })} />
              <Row label="Payment per cycle" value={formatCurrency(loan.paymentAmount)} />
              <Row
                label="Remaining principal"
                value={formatCurrency(loan.remainingBalance)}
              />
              <Row
                label="Scheduled interest remaining"
                value={formatCurrency(estimateRemainingLoanInterest(loan))}
              />
              <Row
                label="Payments remaining"
                value={`${loan.remainingPeriods} · ${formatTerm(loan.remainingPeriods)}`}
              />
              <Row label="Total remaining repayment" strong value={formatCurrency(loan.remainingBalance + estimateRemainingLoanInterest(loan))} />
              <Row
                label="Early payoff fee"
                value={formatCurrency(estimatePrepaymentPenalty(loan))}
              />
              <Row
                label="Early payoff total"
                strong
                value={formatCurrency(
                  loan.remainingBalance + estimatePrepaymentPenalty(loan),
                )}
              />
              <Text style={s.hint}>
                Paying off early avoids the scheduled interest. The fee is 2% of
                remaining principal (minimum €15, capped at 8%).
              </Text>
              <View style={s.actions}>
                <Button
                  compact
                  mode="outlined"
                  onPress={() => onExtra(loan.id)}
                >
                  Extra payment
                </Button>
                <Button
                  compact
                  mode="contained-tonal"
                  onPress={() => onRepay(loan.id)}
                >
                  Pay off{" "}
                  {formatCurrency(
                    loan.remainingBalance + estimatePrepaymentPenalty(loan),
                  )}
                </Button>
              </View>
            </Surface>
          ))
        )}
      </Panel>
      {activeSearch && (
        <Panel title="LENDER SEARCH IN PROGRESS">
          <Text style={s.hint}>
            {activeSearch.criteria.offerCount} offers ·{" "}
            {activeSearch.criteria.lenderTypes.length === 0
              ? "all lender types"
              : activeSearch.criteria.lenderTypes
                  .map((type) => LENDER_TYPE_LABELS[type])
                  .join(", ")}
          </Text>
          <ProgressBar
            progress={
              activeSearch.workCompletedMs / activeSearch.workRequiredMs
            }
          />
          <Row
            label="Progress"
            value={`${Math.round((activeSearch.workCompletedMs / activeSearch.workRequiredMs) * 100)}%`}
          />
          <Text style={s.hint}>
            Searches progress only while foreground game time advances.
          </Text>
        </Panel>
      )}
      {searching ? (
        <Panel title="LENDER SEARCH">
          <Text style={s.hint}>
            Credit rating affects lender eligibility, borrowing limits, rates,
            and origination fees. In finance, economy phase affects offered rates only.
          </Text>
          <Row
            label={`Economy: ${data.economyPhase}`}
            value={`${economyRateLabel} offered rates`}
          />
          <Text style={s.hint}>
            Each narrowed regular-lender, amount, term, and offer-count choice
            multiplies the fee and work. Quickloan-only searches are free.
          </Text>
          <Text variant="titleSmall">Lender types</Text>
          <View style={s.choices}>
            {LENDER_TYPES.map((type) => (
              <Button
                compact
                key={type}
                mode={selectedTypes.includes(type) ? "contained" : "outlined"}
                onPress={() =>
                  setSelectedTypes(
                    selectedTypes.includes(type)
                      ? selectedTypes.filter((entry) => entry !== type)
                      : [...selectedTypes, type],
                  )
                }
              >
                {LENDER_TYPE_LABELS[type]}
              </Button>
            ))}
          </View>
          <RangeSelector
            label="Amount range"
            lowerValue={amountMin}
            maximumValue={1_000_000}
            minimumValue={10}
            onLowerChange={setAmountMin}
            onUpperChange={setAmountMax}
            roundValue={roundAmount}
            upperValue={amountMax}
            valueLabel={formatCurrency}
          />
          <RangeSelector
            label="Term range"
            lowerValue={termMin}
            maximumValue={1_440}
            minimumValue={5}
            onLowerChange={setTermMin}
            onUpperChange={setTermMax}
            roundValue={roundTerm}
            upperValue={termMax}
            valueLabel={formatTerm}
          />
          <NumberChoices
            label="Offers"
            values={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
            selected={offerCount}
            setValue={setOfferCount}
          />
          <Text style={s.hint}>
            Cost: {formatCurrency(estimate.cost)} · Estimated work:{" "}
            {formatElapsedTime(estimate.workRequiredMs)} · Search multiplier:{" "}
            {formatNumber(
              estimate.offerMultiplier *
                estimate.lenderTypeMultiplier *
                estimate.amountRangeMultiplier *
                estimate.durationRangeMultiplier,
              { decimals: 1 },
            )}
            ×
          </Text>
          <View style={s.actions}>
            <Button mode="outlined" onPress={() => setSearching(false)}>
              Cancel
            </Button>
            <Button
              disabled={
                !!activeSearch ||
                amountMin > amountMax ||
                termMin > termMax ||
                estimate.cost > data.assets.cash
              }
              mode="contained"
              onPress={onSearch}
            >
              Start search
            </Button>
          </View>
        </Panel>
      ) : (
        <Panel title="FUNDING">
          <Row
            label="Credit rating"
            strong
            value={`${data.creditRating.grade} (${formatNumber(data.creditRating.score, { percent: true })})`}
          />
          <Row
            label="Economy phase"
            value={`${data.economyPhase} (${economyRateLabel} rates)`}
          />
          <Row
            label="Borrowing available"
            strong
            value={formatCurrency(
              data.loanLimitBreakdown.availableBorrowingLimit,
            )}
          />
          <Text style={s.hint}>
            Credit affects lender eligibility, limits, rates, and origination
            fees. In finance, economy affects offered rates only.
          </Text>
          <Button
            disabled={!!activeSearch}
            mode="contained"
            onPress={() => setSearching(true)}
          >
            Search lenders
          </Button>
        </Panel>
      )}
      {message && <Text style={s.feedback}>{message}</Text>}
      {offers.some((offer) => !offer.isAvailable) && (
        <Button mode="outlined" onPress={onClearUnavailable}>
          Remove unavailable offers
        </Button>
      )}
      {offers.length > 0 && (
        <Panel title="SEARCH RESULTS">
          {offers.map((offer) => (
            <Surface elevation={0} key={offer.id} style={s.loan}>
              <View style={s.loanHeader}>
                <Text variant="titleSmall">{offer.lenderName}</Text>
                <IconButton
                  accessibilityLabel={`Remove ${offer.lenderName} offer`}
                  icon="trash-can-outline"
                  onPress={() => onClearOffer(offer)}
                  size={18}
                  style={s.offerTrash}
                />
              </View>
              <Text style={offer.isAvailable ? s.available : s.negative}>
                {offer.isAvailable
                  ? LENDER_TYPE_LABELS[offer.lenderType]
                  : offer.unavailableReason}
              </Text>
              <Row
                label="Principal / term"
                value={`${formatCurrency(offer.principal)} · ${formatTerm(offer.durationPeriods)}`}
              />
              <Row
                label="52-cycle loan cost"
                strong
                value={formatNumber(calculate52CycleLoanCostRate(offer.principal, offer.paymentAmount, offer.durationPeriods, offer.originationFee), { percent: true, decimals: 1 })}
              />
              <Row
                label="Interest rate per cycle"
                value={formatNumber(offer.periodicInterestRate, {
                  percent: true,
                  decimals: 3,
                })}
                valueColor={getLoanRateColor(offer.periodicInterestRate)}
              />
              <Text style={s.hint}>
                Rate includes this company’s credit and the current{" "}
                {data.economyPhase} economy ({economyRateLabel}).
              </Text>
              <Row
                label="Payment per cycle"
                value={formatCurrency(offer.paymentAmount)}
              />
              <Row
                label="Origination fee"
                value={formatCurrency(offer.originationFee)}
              />
              <Row label="Total borrowing cost" value={formatCurrency(offer.totalCost)} />
              <Row label="Total repayment" strong value={formatCurrency(offer.totalRepayment + offer.originationFee)} />
              <Button
                disabled={!offer.isAvailable}
                mode="contained"
                onPress={() => onAccept(offer)}
              >
                Accept offer
              </Button>
            </Surface>
          ))}
        </Panel>
      )}
    </View>
  );
}
function NumberChoices({
  label,
  selected,
  setValue,
  values,
}: {
  label: string;
  selected: number;
  setValue: (value: number) => void;
  values: readonly number[];
}) {
  return (
    <View style={s.option}>
      <Text variant="titleSmall">{label}</Text>
      <View style={s.choices}>
        {values.map((value) => (
          <Button
            compact
            key={value}
            mode={selected === value ? "contained" : "outlined"}
            onPress={() => setValue(value)}
          >
            {value}
          </Button>
        ))}
      </View>
    </View>
  );
}
function RangeSelector({
  label,
  lowerValue,
  maximumValue,
  minimumValue,
  onLowerChange,
  onUpperChange,
  roundValue,
  upperValue,
  valueLabel,
}: {
  label: string;
  lowerValue: number;
  maximumValue: number;
  minimumValue: number;
  onLowerChange: (value: number) => void;
  onUpperChange: (value: number) => void;
  roundValue: (value: number) => number;
  upperValue: number;
  valueLabel: (value: number) => string;
}) {
  const [trackWidth, setTrackWidth] = useState(1);
  const position = (value: number) =>
    Math.log(value / minimumValue) / Math.log(maximumValue / minimumValue);
  const setFromX = (x: number) => {
    const nextValue = Math.max(
      minimumValue,
      Math.min(
        maximumValue,
        roundValue(
          minimumValue *
            (maximumValue / minimumValue) **
              Math.max(0, Math.min(1, x / trackWidth)),
        ),
      ),
    );
    if (
      Math.abs(position(nextValue) - position(lowerValue)) <=
      Math.abs(position(nextValue) - position(upperValue))
    )
      onLowerChange(Math.min(nextValue, upperValue));
    else onUpperChange(Math.max(nextValue, lowerValue));
  };
  const responder = PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (event) => setFromX(event.nativeEvent.locationX),
    onPanResponderMove: (event) => setFromX(event.nativeEvent.locationX),
    onStartShouldSetPanResponder: () => true,
  });
  const lowerPosition = position(lowerValue);
  const upperPosition = position(upperValue);
  return (
    <View style={s.option}>
      <View style={s.row}>
        <Text variant="titleSmall">{label}</Text>
        <Text style={s.value}>
          {valueLabel(lowerValue)} - {valueLabel(upperValue)}
        </Text>
      </View>
      <View
        accessibilityLabel={`${label}: ${valueLabel(lowerValue)} to ${valueLabel(upperValue)}`}
        onLayout={(event) =>
          setTrackWidth(Math.max(1, event.nativeEvent.layout.width))
        }
        style={s.rangeTouch}
        {...responder.panHandlers}
      >
        <View style={s.rangeTrack} />
        <View
          style={[
            s.rangeFill,
            {
              left: `${lowerPosition * 100}%`,
              right: `${(1 - upperPosition) * 100}%`,
            },
          ]}
        />
        <View style={[s.rangeThumb, { left: `${lowerPosition * 100}%` }]} />
        <View style={[s.rangeThumb, { left: `${upperPosition * 100}%` }]} />
      </View>
      <View style={s.rangeLabels}>
        <Text style={s.hint}>{valueLabel(minimumValue)}</Text>
        <Text style={s.hint}>{valueLabel(maximumValue)}</Text>
      </View>
    </View>
  );
}
function roundAmount(value: number): number {
  const step = value < 1_000 ? 10 : value < 10_000 ? 100 : 1_000;
  return Math.round(value / step) * step;
}
function roundTerm(value: number): number {
  const step = value <= 60 ? 1 : value <= 240 ? 5 : 15;
  return Math.round(value / step) * step;
}
function formatTerm(periods: number): string {
  if (periods < 60) return `${periods} min`;
  const hours = Math.floor(periods / 60);
  const minutes = periods % 60;
  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
}
const s = StyleSheet.create({
  screen: { gap: 10 },
  content: { gap: 10 },
  nav: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tab: {
    alignItems: "center",
    borderColor: "#C7D0CC",
    borderRadius: 10,
    borderWidth: 1,
    flexGrow: 1,
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: 10,
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabLabel: { color: colors.charcoal, fontSize: 12, fontWeight: "700" },
  tabLabelActive: { color: colors.onDark },
  choices: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  card: { gap: 9 },
  kicker: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  value: { color: colors.charcoal, fontWeight: "700" },
  strong: { color: colors.charcoal, fontSize: 16, fontWeight: "800" },
  negative: { color: colors.error, fontWeight: "700" },
  available: { color: colors.primary, fontWeight: "700" },
  hint: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  badge: {
    backgroundColor: "#EAF4FF",
    borderRadius: 8,
    color: colors.primary,
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  loan: {
    backgroundColor: colors.softBackground,
    borderColor: "#D5DEDA",
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
    padding: 10,
  },
  loanHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  offerTrash: { margin: -6 },
  cash: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    gap: 8,
    padding: 13,
  },
  cashName: { flex: 1, gap: 2 },
  details: {
    borderTopColor: "#D5DEDA",
    borderTopWidth: 1,
    gap: 8,
    paddingTop: 8,
  },
  group: { gap: 3 },
  detailStack: { gap: 1 },
  detail: { color: colors.charcoal, fontSize: 12, lineHeight: 18 },
  detailSubline: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    paddingLeft: 12,
  },
  empty: { backgroundColor: colors.surface, borderRadius: 12, padding: 14 },
  feedback: { color: colors.primary, fontWeight: "700" },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  option: { gap: 4 },
  rangeTouch: { height: 42, justifyContent: "center", marginHorizontal: 10 },
  rangeTrack: { backgroundColor: "#C7D0CC", borderRadius: 4, height: 8 },
  rangeFill: {
    backgroundColor: colors.primary,
    borderRadius: 4,
    height: 8,
    position: "absolute",
    top: 17,
  },
  rangeThumb: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    borderRadius: 12,
    borderWidth: 3,
    height: 24,
    marginLeft: -12,
    position: "absolute",
    top: 9,
    width: 24,
  },
  rangeLabels: { flexDirection: "row", justifyContent: "space-between" },
});
