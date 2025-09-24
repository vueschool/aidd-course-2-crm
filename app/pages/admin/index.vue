<template>
  <AdminLayout>
    <h1>Dashboard</h1>
    <div class="grid grid-cols-4 mb-4">
      <div class="card">
        <div class="card-body">
          <h3>{{ stats.customers }}</h3>
          <p class="text-secondary">Total Customers</p>
        </div>
      </div>
      <div class="card">
        <div class="card-body">
          <h3>{{ stats.sales }}</h3>
          <p class="text-secondary">Total Sales</p>
        </div>
      </div>
      <div class="card">
        <div class="card-body">
          <h3>${{ stats.revenue.toLocaleString() }}</h3>
          <p class="text-secondary">Total Revenue</p>
        </div>
      </div>
      <div class="card">
        <div class="card-body">
          <h3>${{ stats.avgSale.toFixed(2) }}</h3>
          <p class="text-secondary">Average Sale</p>
        </div>
      </div>
    </div>

    <h2>Recent Sales</h2>
    <div class="card">
      <div class="card-body">
        <table class="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Customer</th>
              <th>Description</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="purchase in recentSales" :key="purchase.id">
              <td>{{ new Date(purchase.purchaseDate).toLocaleDateString() }}</td>
              <td>
                <NuxtLink v-if="purchase.customer" :to="`/admin/customers/${purchase.customer.id}`">
                  {{ purchase.customer.firstName }} {{ purchase.customer.lastName }}
                </NuxtLink>
                <span v-else>-</span>
              </td>
              <td>{{ purchase.description }}</td>
              <td>${{ purchase.amount.toFixed(2) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const stats = ref({
  customers: 0,
  sales: 0,
  revenue: 0,
  avgSale: 0
})

const recentSales = ref([])

onMounted(async () => {
  const [customersData, purchasesData] = await Promise.all([
    $fetch('/api/customers?limit=100'),
    $fetch('/api/purchases?limit=10')
  ])

  recentSales.value = purchasesData.data
  stats.value.customers = customersData.data.length
  stats.value.sales = purchasesData.data.length

  // Calculate total revenue and average sale
  const totalRevenue = purchasesData.data.reduce((sum, purchase) => sum + purchase.amount, 0)
  stats.value.revenue = totalRevenue
  stats.value.avgSale = purchasesData.data.length > 0 ? totalRevenue / purchasesData.data.length : 0
})
</script>