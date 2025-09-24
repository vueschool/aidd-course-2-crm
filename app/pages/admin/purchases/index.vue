<template>
  <AdminLayout>
    <div class="flex flex-between mb-3">
      <h1>Purchases</h1>
    </div>

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
            <tr v-for="purchase in purchases" :key="purchase.id">
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

const purchases = ref([])

onMounted(async () => {
  const data = await $fetch('/api/purchases')
  purchases.value = data.data
})
</script>