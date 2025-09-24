<template>
  <AdminLayout>
    <div class="flex flex-between mb-3">
      <h1>Customers</h1>
      <NuxtLink to="/admin/customers/new" class="btn btn-primary">
        Add Customer
      </NuxtLink>
    </div>

    <div class="card">
      <div class="card-body">
        <table class="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Organization</th>
              <th>Credit</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="customer in customers" :key="customer.id">
              <td>
                <NuxtLink :to="`/admin/customers/${customer.id}`">
                  {{ customer.firstName }} {{ customer.lastName }}
                </NuxtLink>
              </td>
              <td>
                <NuxtLink
                  v-if="customer.organization"
                  :to="`/admin/organizations/${customer.organization.id}`"
                >
                  {{ customer.organization.name }}
                </NuxtLink>
                <span v-else>-</span>
              </td>
              <td>${{ customer.credit?.toFixed(2) || '0.00' }}</td>
              <td>{{ customer.email || '-' }}</td>
              <td>{{ customer.phone || '-' }}</td>
              <td>
                <div class="btn-group">
                  <NuxtLink
                    :to="`/admin/customers/${customer.id}`"
                    class="btn btn-sm btn-secondary"
                  >
                    View
                  </NuxtLink>
                  <NuxtLink
                    :to="`/admin/customers/${customer.id}/edit?return=/admin/customers`"
                    class="btn btn-sm btn-secondary"
                  >
                    Edit
                  </NuxtLink>
                </div>
              </td>
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

const customers = ref([])

onMounted(async () => {
  const data = await $fetch('/api/customers')
  customers.value = data.data
})
</script>