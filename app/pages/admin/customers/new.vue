<template>
  <AdminLayout>
    <h1>New Customer</h1>

    <div class="card">
      <div class="card-body">
        <form @submit.prevent="handleSubmit">
          <div class="grid grid-cols-2">
            <div class="form-group">
              <label class="form-label" for="firstName">First Name *</label>
              <input
                id="firstName"
                v-model="form.firstName"
                type="text"
                class="form-input"
                required
              />
            </div>
            <div class="form-group">
              <label class="form-label" for="lastName">Last Name *</label>
              <input
                id="lastName"
                v-model="form.lastName"
                type="text"
                class="form-input"
                required
              />
            </div>
            <div class="form-group">
              <label class="form-label" for="organizationId">Organization (Optional)</label>
              <select
                id="organizationId"
                v-model="form.organizationId"
                class="form-select"
              >
                <option value="">No organization</option>
                <option
                  v-for="org in organizations"
                  :key="org.id"
                  :value="org.id"
                >
                  {{ org.name }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="credit">Store Credit</label>
              <input
                id="credit"
                v-model.number="form.credit"
                type="number"
                step="0.01"
                min="0"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label class="form-label" for="position">Position</label>
              <input
                id="position"
                v-model="form.position"
                type="text"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label class="form-label" for="department">Department</label>
              <input
                id="department"
                v-model="form.department"
                type="text"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label class="form-label" for="email">Email</label>
              <input
                id="email"
                v-model="form.email"
                type="email"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label class="form-label" for="phone">Phone</label>
              <input
                id="phone"
                v-model="form.phone"
                type="tel"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label class="form-label" for="mobile">Mobile</label>
              <input
                id="mobile"
                v-model="form.mobile"
                type="tel"
                class="form-input"
              />
            </div>
          </div>

          <div v-if="error" class="alert alert-danger">
            {{ error }}
          </div>

          <div class="btn-group">
            <button type="submit" class="btn btn-primary" :disabled="loading">
              <span v-if="loading" class="loading"></span>
              <span v-else>Create Customer</span>
            </button>
            <NuxtLink to="/admin/customers" class="btn btn-secondary">
              Cancel
            </NuxtLink>
          </div>
        </form>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const route = useRoute()
const loading = ref(false)
const error = ref('')
const organizations = ref([])

const form = ref({
  firstName: '',
  lastName: '',
  organizationId: '',
  position: '',
  department: '',
  email: '',
  phone: '',
  mobile: '',
  credit: 0
})

onMounted(async () => {
  const data = await $fetch('/api/organizations')
  organizations.value = data.data

  // Check if organizationId was passed as query param
  if (route.query.organizationId) {
    form.value.organizationId = Number(route.query.organizationId)
  }
})

const handleSubmit = async () => {
  loading.value = true
  error.value = ''

  try {
    await $fetch('/api/customers', {
      method: 'POST',
      body: {
        ...form.value,
        organizationId: form.value.organizationId || null
      }
    })
    await navigateTo('/admin/customers')
  } catch (e: any) {
    error.value = e.data?.statusMessage || 'Failed to create customer'
  } finally {
    loading.value = false
  }
}
</script>