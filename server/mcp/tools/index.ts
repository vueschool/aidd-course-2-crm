import * as searchCustomers from './search-customers'
import * as getCustomerProfile from './get-customer-profile'
import * as changeCustomerPlan from './change-customer-plan'
import * as creditAccount from './credit-account'
import * as sendEmailToCustomer from './send-email-to-customer'

export const tools = [
  searchCustomers,
  getCustomerProfile,
  changeCustomerPlan,
  creditAccount,
  sendEmailToCustomer
]

export const toolDefinitions = tools.map(tool => tool.definition)

export const toolHandlers = Object.fromEntries(
  tools.map(tool => [tool.definition.name, tool.handler])
)