<template>
  <div class="admin-layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <h3>CRM Admin</h3>
      </div>
      <nav class="sidebar-nav">
        <NuxtLink
          to="/admin/customers"
          class="sidebar-link"
          :class="{ active: route.path.startsWith('/admin/customers') }"
        >
          <Icon name="mdi:account-group" size="20" />
          <span>Customers</span>
        </NuxtLink>
        <NuxtLink
          to="/admin"
          class="sidebar-link"
          :class="{ active: route.path === '/admin' }"
        >
          <Icon name="mdi:view-dashboard" size="20" />
          <span>Dashboard</span>
        </NuxtLink>
        <NuxtLink
          to="/admin/organizations"
          class="sidebar-link"
          :class="{ active: route.path.startsWith('/admin/organizations') }"
        >
          <Icon name="mdi:domain" size="20" />
          <span>Organizations</span>
        </NuxtLink>
        <NuxtLink
          to="/admin/purchases"
          class="sidebar-link"
          :class="{ active: route.path.startsWith('/admin/purchases') }"
        >
          <Icon name="mdi:cart" size="20" />
          <span>Purchases</span>
        </NuxtLink>
      </nav>
      <div class="sidebar-footer">
        <button @click="handleLogout" class="sidebar-link">
          <Icon name="mdi:logout" size="20" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
    <main class="main-content">
      <div class="container">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { logout } = useAuth()

const handleLogout = async () => {
  await logout()
}
</script>

<style scoped>
.admin-layout {
  display: flex;
  height: 100vh;
}

.sidebar {
  width: 250px;
  background-color: #f8f9fa;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.sidebar-nav {
  flex: 1;
  padding: 1rem 0;
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0.75rem 1.5rem;
  color: #333;
  text-decoration: none;
  transition: background-color 0.2s;
  border: none;
  background: none;
  width: 100%;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.95rem;
}

.sidebar-link:hover {
  background-color: #e9ecef;
}

.sidebar-link.active {
  background-color: #fff;
  border-right: 3px solid #007bff;
  color: #007bff;
  font-weight: 500;
}

.sidebar-footer {
  padding: 1rem 0;
  border-top: 1px solid #e0e0e0;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  background-color: #fff;
}

.main-content .container {
  max-width: none;
  padding: 2rem;
}

@media (max-width: 768px) {
  .sidebar {
    width: 200px;
  }

  .sidebar-link span {
    font-size: 0.9rem;
  }
}
</style>