// Typed navigation helpers
export type RootStackParamList = {
  Login: undefined
  Dashboard: undefined
  SetupViewer: undefined
  BikesScreen: { initialFilter?: string } | undefined
  InventoryScreen: undefined
  SettingsScreen: undefined
  NewBike: undefined
  BikeDetail: { id: string }
  EditBike: { id: string }
  ChangeCategory: { id: string }
  Reception: { id: string }
  Sale: { id: string }
  Loan: { id: string }
  LoanReturn: { id: string }
  FaultTreatment: { id: string }
  BillOfSale: { id: string; saleId: string }
  LoanDoc: { id: string; loanId: string }
}
