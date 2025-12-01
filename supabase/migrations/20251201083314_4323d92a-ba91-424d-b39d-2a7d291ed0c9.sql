-- Create CVs storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cvs', 
  'cvs', 
  false, 
  10485760, 
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- RLS Policy: Workers can upload their own CV
CREATE POLICY "Workers can upload their own CV"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'cvs' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policy: Workers can view their own CV
CREATE POLICY "Workers can view their own CV"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'cvs' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policy: Workers can update their own CV
CREATE POLICY "Workers can update their own CV"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'cvs' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policy: Workers can delete their own CV
CREATE POLICY "Workers can delete their own CV"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'cvs' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policy: Businesses can view CVs of fully disclosed workers
CREATE POLICY "Businesses can view disclosed CVs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'cvs'
  AND EXISTS (
    SELECT 1 FROM worker_profiles wp
    JOIN profiles p ON p.id = wp.profile_id
    WHERE (storage.foldername(name))[1] = p.user_id::text
    AND wp.visibility_mode = 'fully_disclosed'
  )
);

-- Seed test questions for all finance roles
-- ACCOUNTS PAYABLE
INSERT INTO test_questions (role, question_text, options, correct_answer) VALUES
('accounts_payable', 'What is the standard payment term for invoices in the UK if not specified?', '["7 days", "14 days", "30 days", "60 days"]', 2),
('accounts_payable', 'Which document authorizes payment to a supplier?', '["Purchase order", "Delivery note", "Invoice", "Payment authorization"]', 3),
('accounts_payable', 'What is a three-way match in accounts payable?', '["Matching PO, invoice, and delivery note", "Matching three invoices", "Matching three suppliers", "Matching invoice, payment, and receipt"]', 0),
('accounts_payable', 'When should early payment discounts be recorded?', '["When invoice is received", "When payment is made", "At month end", "When discount is taken"]', 3),
('accounts_payable', 'What is the primary purpose of an aged creditors report?', '["Track overdue payments to suppliers", "Calculate VAT", "Reconcile bank statements", "Record new suppliers"]', 0),
('accounts_payable', 'How should duplicate invoices be prevented?', '["Check invoice number and date before processing", "Pay all invoices immediately", "Only process month-end invoices", "Ignore small invoices"]', 0),
('accounts_payable', 'What information is required on a valid UK VAT invoice?', '["VAT number, date, description, VAT amount", "Just the total amount", "Company name only", "Payment terms only"]', 0),
('accounts_payable', 'When reconciling supplier statements, what should be investigated?', '["Discrepancies between statement and ledger", "All payments made", "All suppliers", "Monthly totals only"]', 0),
('accounts_payable', 'What is the Late Payment of Commercial Debts Act threshold for statutory interest?', '["8% plus Bank of England base rate", "5% flat rate", "10% flat rate", "2% per month"]', 0),
('accounts_payable', 'How should credit notes from suppliers be processed?', '["Reduce balance owed to supplier", "Ignore until year end", "Create new invoice", "Pay supplier more"]', 0),
('accounts_payable', 'What is the purpose of segregation of duties in AP?', '["Prevent fraud by separating authorization and payment", "Speed up processing", "Reduce staff costs", "Eliminate suppliers"]', 0),
('accounts_payable', 'When should accruals be posted in accounts payable?', '["When goods/services received but not invoiced", "Only at year end", "When payment is made", "Never needed"]', 0),

-- ACCOUNTS RECEIVABLE
('accounts_receivable', 'What is the standard credit term for UK B2B transactions if not agreed otherwise?', '["7 days", "30 days", "60 days", "90 days"]', 1),
('accounts_receivable', 'What is an aged debtors report used for?', '["Track overdue customer payments", "Calculate sales tax", "Record new sales", "Pay suppliers"]', 0),
('accounts_receivable', 'When should revenue be recognized under accrual accounting?', '["When goods/services are delivered", "When payment is received", "At month end", "At year end"]', 0),
('accounts_receivable', 'What is the purpose of credit control?', '["Minimize bad debts and ensure timely payment", "Maximize sales only", "Reduce prices", "Eliminate customers"]', 0),
('accounts_receivable', 'How should bad debt provisions be calculated?', '["Based on aging analysis and historical experience", "Fixed 10% of all debts", "Only when customer goes bankrupt", "Not needed"]', 0),
('accounts_receivable', 'What action should be taken for invoices overdue by 60+ days?', '["Escalate to senior management, consider legal action", "Ignore and hope for payment", "Write off immediately", "Send one more invoice"]', 0),
('accounts_receivable', 'When applying payments, what is the correct order if unspecified?', '["Oldest invoices first (FIFO)", "Newest invoices first", "Largest invoices first", "Random allocation"]', 0),
('accounts_receivable', 'What is a sales ledger control account?', '["Summary of all customer balances in nominal ledger", "List of suppliers", "Bank reconciliation", "VAT return"]', 0),
('accounts_receivable', 'How should customer disputes be handled?', '["Investigate promptly, resolve, and document", "Ignore until paid", "Write off immediately", "Charge late fees"]', 0),
('accounts_receivable', 'What is the Late Payment Act daily interest rate?', '["Bank base rate + 8% divided by 365", "1% per day", "5% per month", "Fixed £100 fee"]', 0),
('accounts_receivable', 'When should credit notes be issued?', '["For returns, errors, or agreed discounts", "Never issue credit notes", "Only at year end", "For all customers monthly"]', 0),

-- BOOKKEEPER
('bookkeeper', 'What is the purpose of a bank reconciliation?', '["Match bank statement with company cash book", "Calculate interest earned", "Open new accounts", "Pay suppliers"]', 0),
('bookkeeper', 'In double-entry bookkeeping, what is a debit?', '["Left side entry, increases assets/expenses", "Right side entry only", "Always negative", "Credit card payment"]', 0),
('bookkeeper', 'What is the accounting equation?', '["Assets = Liabilities + Equity", "Income = Expenses", "Debits = Credits always", "Revenue = Profit"]', 0),
('bookkeeper', 'Which accounts normally have a debit balance?', '["Assets and expenses", "Liabilities and income", "Only bank accounts", "All accounts"]', 0),
('bookkeeper', 'What is a trial balance used for?', '["Check debits equal credits before financial statements", "Calculate VAT", "Pay employees", "Order supplies"]', 0),
('bookkeeper', 'When should petty cash be reconciled?', '["Regularly (weekly/monthly) to ensure accuracy", "Only at year end", "Never needed", "When it runs out"]', 0),
('bookkeeper', 'What is the purpose of a nominal ledger?', '["Record all financial transactions by account", "List customers only", "Track inventory only", "Record employee details"]', 0),
('bookkeeper', 'How should bank charges be recorded?', '["Debit bank charges expense, credit bank account", "Ignore them", "Only record annually", "Add to sales"]', 0),
('bookkeeper', 'What is a journal entry?', '["Manual accounting entry with debits and credits", "Bank statement", "Invoice copy", "Receipt"]', 0),
('bookkeeper', 'When posting VAT, what accounts are used?', '["VAT control account (input/output VAT)", "Sales account only", "Bank account only", "No accounts needed"]', 0),
('bookkeeper', 'What is the difference between cash and accrual basis?', '["Cash: record when paid/received; Accrual: when earned/incurred", "No difference", "Cash is always better", "Accrual is simpler"]', 0),
('bookkeeper', 'How often should ledger accounts be reconciled?', '["Monthly at minimum", "Only at year end", "Never needed", "Every 5 years"]', 0),

-- PAYROLL CLERK
('payroll_clerk', 'What is the current UK personal allowance threshold (2024/25)?', '["£12,570", "£10,000", "£15,000", "£20,000"]', 0),
('payroll_clerk', 'What does PAYE stand for?', '["Pay As You Earn", "Pay After Year End", "Payroll Annual Year End", "Pay All Your Employees"]', 0),
('payroll_clerk', 'What is the employer Class 1 NI rate for 2024/25?', '["13.8% above £9,100", "12% above £12,570", "15% on all earnings", "10% flat rate"]', 1),
('payroll_clerk', 'When must payroll submissions (FPS) be filed with HMRC?', '["On or before payment date", "Monthly by 19th", "Quarterly", "Annually"]', 0),
('payroll_clerk', 'What is Statutory Sick Pay (SSP) per week for 2024/25?', '["£116.75", "£100.00", "£150.00", "£200.00"]', 0),
('payroll_clerk', 'What is the minimum auto-enrolment contribution (employer + employee)?', '["8% (employer 3%, employee 5%)", "5% total", "10% total", "15% total"]', 0),
('payroll_clerk', 'What is a P45 used for?', '["Given to employee when leaving employment", "Used for new starters", "Annual tax summary", "Pension enrollment"]', 0),
('payroll_clerk', 'What is a P60?', '["Annual summary of pay and tax deducted", "Leaving certificate", "Starter checklist", "Benefits form"]', 0),
('payroll_clerk', 'When must payroll records be kept?', '["At least 3 years from end of tax year", "1 year", "Forever", "6 months"]', 0),
('payroll_clerk', 'What is the standard maternity pay period?', '["39 weeks", "26 weeks", "52 weeks", "12 weeks"]', 0),
('payroll_clerk', 'What tax code indicates no tax-free allowance?', '["0T or BR", "1257L", "K code", "NT"]', 0),
('payroll_clerk', 'When is the payroll year end in the UK?', '["5th April", "31st March", "31st December", "30th June"]', 0),

-- MANAGEMENT ACCOUNTANT
('management_accountant', 'What is variance analysis used for?', '["Compare actual performance to budget", "Calculate VAT", "Reconcile bank accounts", "Pay suppliers"]', 0),
('management_accountant', 'What is a key performance indicator (KPI)?', '["Measurable value showing performance vs objectives", "Budget total", "Last year sales", "Employee count"]', 0),
('management_accountant', 'What is the difference between fixed and variable costs?', '["Fixed: constant regardless of output; Variable: change with output", "No difference", "Fixed are always higher", "Variable never change"]', 0),
('management_accountant', 'What is break-even analysis?', '["Calculate point where revenue equals costs", "Determine maximum sales", "Calculate tax liability", "Measure profit only"]', 0),
('management_accountant', 'What is a rolling forecast?', '["Continuously updated forecast for fixed period ahead", "Annual budget only", "Historical analysis", "Static 5-year plan"]', 0),
('management_accountant', 'What is contribution margin?', '["Sales revenue minus variable costs", "Total profit", "Sales minus all costs", "Fixed costs only"]', 0),
('management_accountant', 'What is the purpose of cost allocation?', '["Assign indirect costs to products/departments", "Calculate sales tax", "Pay employees", "Reconcile accounts"]', 0),
('management_accountant', 'What is a budget variance?', '["Difference between budgeted and actual amounts", "Total budget", "Last year result", "Forecast error"]', 0),
('management_accountant', 'What is activity-based costing (ABC)?', '["Allocate costs based on activities that drive costs", "Historical cost method", "Standard costing", "Average costing"]', 0),
('management_accountant', 'What should be included in a management report?', '["KPIs, variances, trends, and commentary", "Just numbers", "Historical data only", "Future plans only"]', 0),
('management_accountant', 'What is the purpose of scenario planning?', '["Model different future outcomes and their impacts", "Record past results", "Calculate current profit", "Reconcile accounts"]', 0),

-- CREDIT CONTROLLER
('credit_controller', 'What is a credit limit?', '["Maximum amount of credit extended to a customer", "Minimum order value", "Delivery charge", "VAT threshold"]', 0),
('credit_controller', 'What is the purpose of credit checking new customers?', '["Assess creditworthiness and reduce bad debt risk", "Increase sales", "Speed up delivery", "Reduce prices"]', 0),
('credit_controller', 'What is Days Sales Outstanding (DSO)?', '["Average days to collect payment from customers", "Days to pay suppliers", "Inventory turnover", "Profit margin"]', 0),
('credit_controller', 'When should credit terms be reviewed?', '["Regularly and when customer circumstances change", "Never", "Only at year end", "Only for new customers"]', 0),
('credit_controller', 'What is the typical escalation process for overdue debts?', '["Reminder → Phone call → Final notice → Legal action", "Immediate legal action", "Ignore and write off", "Send one email only"]', 0),
('credit_controller', 'What is a retention of title clause?', '["Seller retains ownership until payment is made", "Discount for early payment", "Extended payment terms", "Credit insurance"]', 0),
('credit_controller', 'What information should be gathered during collection calls?', '["Payment commitment, reason for delay, dispute details", "Nothing needed", "Personal information only", "Company history"]', 0),
('credit_controller', 'What is trade credit insurance?', '["Insurance against customer non-payment", "Product liability insurance", "Employee insurance", "Building insurance"]', 0),
('credit_controller', 'When should a debt be written off?', '["When collection is deemed impossible after all actions", "After 30 days", "Immediately if overdue", "Never write off debts"]', 0),
('credit_controller', 'What is a payment plan?', '["Structured agreement to pay debt in installments", "One-time payment", "Write-off agreement", "Discount scheme"]', 0),

-- FINANCIAL CONTROLLER
('financial_controller', 'What are the main financial statements required in the UK?', '["Profit & Loss, Balance Sheet, Cash Flow", "Only P&L", "Only Balance Sheet", "Sales report only"]', 0),
('financial_controller', 'What is internal control?', '["Processes ensuring reliability, compliance, and asset safeguarding", "External audit", "Tax filing", "Sales strategy"]', 0),
('financial_controller', 'What is the purpose of a month-end close process?', '["Finalize accounts and produce accurate financial reports", "Pay suppliers", "Review sales", "Hire staff"]', 0),
('financial_controller', 'What is GAAP?', '["Generally Accepted Accounting Principles", "Government Accounting Policies", "General Audit Procedures", "Global Asset Pricing"]', 0),
('financial_controller', 'What is the difference between FRS 102 and full IFRS?', '["FRS 102: UK SME standard; IFRS: international standard", "No difference", "FRS 102 for large companies only", "IFRS is simpler"]', 0),
('financial_controller', 'What is working capital?', '["Current assets minus current liabilities", "Total assets", "Cash only", "Fixed assets"]', 0),
('financial_controller', 'What is the purpose of financial controls?', '["Prevent errors, fraud, and ensure compliance", "Increase sales", "Reduce staff", "Speed up processes"]', 0),
('financial_controller', 'What is the cash conversion cycle?', '["Time to convert inventory/receivables into cash", "Payment processing time", "Bank transfer time", "Annual profit cycle"]', 0),
('financial_controller', 'What is the role of a financial controller?', '["Oversee accounting operations, reporting, and compliance", "Sales management", "HR functions", "Marketing"]', 0),
('financial_controller', 'What is the current UK Corporation Tax rate (2024)?', '["25% for profits over £250k, 19% small profits rate", "20% flat", "30% flat", "15% flat"]', 0),
('financial_controller', 'What is a management letter from auditors?', '["Communication of internal control weaknesses", "Invoice for audit fees", "Approval of accounts", "Tax notice"]', 0),

-- FINANCE MANAGER
('finance_manager', 'What is strategic financial planning?', '["Long-term financial strategy aligned with business goals", "Daily bookkeeping", "Monthly reconciliation", "Annual budgeting only"]', 0),
('finance_manager', 'What is the role of a finance manager?', '["Lead finance team, reporting, planning, and controls", "Data entry", "Filing only", "Audit only"]', 0),
('finance_manager', 'What is financial modeling?', '["Building representations of company financial performance", "Bank reconciliation", "VAT return", "Payroll processing"]', 0),
('finance_manager', 'What is capital budgeting?', '["Process of planning and managing long-term investments", "Operating expense budget", "Petty cash", "Payroll planning"]', 0),
('finance_manager', 'What is return on investment (ROI)?', '["Measure of profitability of an investment", "Total revenue", "Cost of sales", "Tax rate"]', 0),
('finance_manager', 'What is financial risk management?', '["Identifying and mitigating financial risks", "Increasing risk", "Ignoring risks", "Sales planning"]', 0),
('finance_manager', 'What is treasury management?', '["Managing company cash, banking, and funding", "Accounting only", "Tax compliance", "Payroll"]', 0),
('finance_manager', 'What is the purpose of financial forecasting?', '["Predict future financial performance for planning", "Historical reporting only", "Tax calculation", "Audit preparation"]', 0),
('finance_manager', 'What is stakeholder reporting?', '["Providing financial information to investors/management", "Internal memos only", "Sales reports", "Inventory counts"]', 0),
('finance_manager', 'What is financial due diligence?', '["Comprehensive financial review for transactions/investments", "Daily bookkeeping", "Monthly close", "Annual audit"]', 0),

-- CFO/FP&A
('cfo_fpa', 'What is FP&A?', '["Financial Planning & Analysis", "Financial Profit Analysis", "Fixed Price Accounting", "Future Plan Assessment"]', 0),
('cfo_fpa', 'What is the role of a CFO?', '["Lead financial strategy, reporting to board/CEO", "Bookkeeping", "Data entry", "Filing"]', 0),
('cfo_fpa', 'What is enterprise value (EV)?', '["Total value of company including debt", "Market cap only", "Revenue", "Profit"]', 0),
('cfo_fpa', 'What is EBITDA?', '["Earnings Before Interest, Tax, Depreciation, Amortization", "Net profit", "Gross profit", "Revenue"]', 0),
('cfo_fpa', 'What is sensitivity analysis?', '["Testing how outcomes change with different assumptions", "Historical analysis only", "Fixed forecast", "Budget variance"]', 0),
('cfo_fpa', 'What is a leveraged buyout (LBO)?', '["Acquisition financed largely with debt", "Cash purchase only", "Merger", "Share swap"]', 0),
('cfo_fpa', 'What is working capital optimization?', '["Managing current assets/liabilities efficiently", "Increasing inventory", "Extending payables indefinitely", "Ignoring receivables"]', 0),
('cfo_fpa', 'What is the weighted average cost of capital (WACC)?', '["Average cost of company financing sources", "Interest rate only", "Tax rate", "Profit margin"]', 0),
('cfo_fpa', 'What is strategic financial leadership?', '["Aligning financial strategy with business objectives", "Bookkeeping", "Data entry", "Filing"]', 0),
('cfo_fpa', 'What is board-level financial reporting?', '["High-level strategic financial reports for directors", "Detailed transaction lists", "Daily reports", "Payroll summaries"]', 0),
('cfo_fpa', 'What is merger and acquisition (M&A) analysis?', '["Financial evaluation of potential business combinations", "Sales planning", "HR planning", "Marketing analysis"]', 0);