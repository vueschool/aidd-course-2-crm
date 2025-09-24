<template>
  <AdminLayout>
    <div v-if="customer">
      <div class="flex flex-between mb-3">
        <h1>{{ customer.firstName }} {{ customer.lastName }}</h1>
        <div class="btn-group">
          <NuxtLink
            :to="`/admin/customers/${customer.id}/edit?return=/admin/customers/${customer.id}`"
            class="btn btn-primary"
          >
            Edit
          </NuxtLink>
          <button @click="handleDelete" class="btn btn-danger">
            Delete
          </button>
        </div>
      </div>

      <div class="card mb-3">
        <div class="card-header">
          <h3>Customer Details</h3>
        </div>
        <div class="card-body">
          <div class="grid grid-cols-2">
            <div>
              <p class="text-secondary text-sm">Organization</p>
              <p>
                <NuxtLink
                  v-if="customer.organizationId"
                  :to="`/admin/organizations/${customer.organizationId}`"
                >
                  {{ organization?.name || '-' }}
                </NuxtLink>
                <span v-else>No organization</span>
              </p>
            </div>
            <div>
              <p class="text-secondary text-sm">Store Credit</p>
              <p>${{ customer.credit?.toFixed(2) || '0.00' }}</p>
            </div>
            <div>
              <p class="text-secondary text-sm">Position</p>
              <p>{{ customer.position || '-' }}</p>
            </div>
            <div>
              <p class="text-secondary text-sm">Department</p>
              <p>{{ customer.department || '-' }}</p>
            </div>
            <div>
              <p class="text-secondary text-sm">Email</p>
              <p>
                <a v-if="customer.email" :href="`mailto:${customer.email}`">
                  {{ customer.email }}
                </a>
                <span v-else>-</span>
              </p>
            </div>
            <div>
              <p class="text-secondary text-sm">Phone</p>
              <p>{{ customer.phone || '-' }}</p>
            </div>
            <div>
              <p class="text-secondary text-sm">Mobile</p>
              <p>{{ customer.mobile || '-' }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="loading"></div>
  </AdminLayout>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const route = useRoute()
const customer = ref(null)
const organization = ref(null)

onMounted(async () => {
  customer.value = await $fetch(`/api/customers/${route.params.id}`)

  if (customer.value?.organizationId) {
    organization.value = await $fetch(`/api/organizations/${customer.value.organizationId}`)
  }
})

const handleDelete = async () => {
  if (confirm('Are you sure you want to delete this customer?')) {
    await $fetch(`/api/customers/${route.params.id}`, {
      method: 'DELETE'
    })
    await navigateTo('/admin/customers')
  }
}
</script>