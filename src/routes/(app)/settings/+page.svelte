<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import * as Tabs from "$lib/components/ui/tabs/index.js";
	import * as Select from "$lib/components/ui/select/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { Switch } from "$lib/components/ui/switch/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { enhance } from "$app/forms";
	import { toast } from "svelte-sonner";
	import { parseUserAgent } from "$lib/utils/user-agent.js";
	import MonitorIcon from "@lucide/svelte/icons/monitor";
	import SmartphoneIcon from "@lucide/svelte/icons/smartphone";
	import TabletIcon from "@lucide/svelte/icons/tablet";
	import GlobeIcon from "@lucide/svelte/icons/globe";
	import BellIcon from "@lucide/svelte/icons/bell";
	import UserPlusIcon from "@lucide/svelte/icons/user-plus";
	import FileTextIcon from "@lucide/svelte/icons/file-text";
	import ShieldAlertIcon from "@lucide/svelte/icons/shield-alert";
	import AlertTriangleIcon from "@lucide/svelte/icons/alert-triangle";
	import CalendarIcon from "@lucide/svelte/icons/calendar";
	import WrenchIcon from "@lucide/svelte/icons/wrench";

	let { data, form } = $props();

	$effect(() => {
		if (form?.message) toast.error(form.message);
		if (form?.success) {
			const messages: Record<string, string> = {
				profile: "Profile updated",
				password: "Password changed",
				settings: "Settings saved",
				session: "Session revoked",
				sessions: "All other sessions revoked",
				notifications: "Notification preferences saved",
			};
			toast.success(messages[form.action as string] ?? "Saved");
		}
	});

	function getDeviceIcon(device: string) {
		if (device === "Mobile") return SmartphoneIcon;
		if (device === "Tablet") return TabletIcon;
		return MonitorIcon;
	}

	function timeAgo(date: Date | null): string {
		if (!date) return "Unknown";
		const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
		if (seconds < 60) return "Just now";
		if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
		if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
		return `${Math.floor(seconds / 86400)}d ago`;
	}

	const notifLabels: Record<string, { label: string; description: string; icon: typeof BellIcon }> =
		{
			notif_new_user: {
				label: "New user registrations",
				description: "Get notified when a new user signs up",
				icon: UserPlusIcon,
			},
			notif_content_published: {
				label: "Content published",
				description: "Get notified when content is published",
				icon: FileTextIcon,
			},
			notif_security_alert: {
				label: "Security alerts",
				description: "Important security notifications",
				icon: ShieldAlertIcon,
			},
			notif_system_warning: {
				label: "System warnings",
				description: "System health and performance alerts",
				icon: AlertTriangleIcon,
			},
			notif_weekly_digest: {
				label: "Weekly digest",
				description: "Weekly summary of activity and stats",
				icon: CalendarIcon,
			},
			notif_maintenance: {
				label: "Maintenance notices",
				description: "Scheduled maintenance notifications",
				icon: WrenchIcon,
			},
		};
</script>

<svelte:head>
	<title>Settings - SvelteForge Admin</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h1 class="text-3xl font-bold tracking-tight">Settings</h1>
		<p class="text-muted-foreground">Manage your profile and application preferences.</p>
	</div>

	<Tabs.Root value="profile">
		<Tabs.List>
			<Tabs.Trigger value="profile">Profile</Tabs.Trigger>
			<Tabs.Trigger value="sessions">Sessions</Tabs.Trigger>
			<Tabs.Trigger value="notifications">Notifications</Tabs.Trigger>
			{#if data.isAdmin}
				<Tabs.Trigger value="application">Application</Tabs.Trigger>
			{/if}
		</Tabs.List>

		<Tabs.Content value="profile" class="space-y-6 pt-4">
			<Card.Root>
				<Card.Header>
					<Card.Title>Profile Information</Card.Title>
					<Card.Description>Update your name and email address.</Card.Description>
				</Card.Header>
				<Card.Content>
					<form method="POST" action="?/updateProfile" use:enhance class="space-y-4">
						<div class="grid gap-2">
							<Label for="name">Name</Label>
							<Input id="name" name="name" value={data.profile.name} required />
						</div>
						<div class="grid gap-2">
							<Label for="email">Email</Label>
							<Input id="email" name="email" type="email" value={data.profile.email} required />
						</div>
						<div class="grid gap-2">
							<Label>Username</Label>
							<Input value={data.profile.username} disabled />
							<p class="text-muted-foreground text-xs">Username cannot be changed.</p>
						</div>
						<Button type="submit">Save Profile</Button>
					</form>
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header>
					<Card.Title>Change Password</Card.Title>
					<Card.Description
						>Update your password. You'll need your current password.</Card.Description
					>
				</Card.Header>
				<Card.Content>
					<form method="POST" action="?/changePassword" use:enhance class="space-y-4">
						<div class="grid gap-2">
							<Label for="currentPassword">Current Password</Label>
							<Input id="currentPassword" name="currentPassword" type="password" required />
						</div>
						<Separator />
						<div class="grid gap-2">
							<Label for="newPassword">New Password</Label>
							<Input
								id="newPassword"
								name="newPassword"
								type="password"
								placeholder="6+ characters"
								required
							/>
						</div>
						<div class="grid gap-2">
							<Label for="confirmPassword">Confirm New Password</Label>
							<Input id="confirmPassword" name="confirmPassword" type="password" required />
						</div>
						<Button type="submit">Change Password</Button>
					</form>
				</Card.Content>
			</Card.Root>
		</Tabs.Content>

		<Tabs.Content value="sessions" class="space-y-6 pt-4">
			<Card.Root>
				<Card.Header>
					<div class="flex items-center justify-between">
						<div>
							<Card.Title>Active Sessions</Card.Title>
							<Card.Description>Manage your active sessions across devices.</Card.Description>
						</div>
						{#if data.sessions.length > 1}
							<form method="POST" action="?/revokeAllOtherSessions" use:enhance>
								<Button type="submit" variant="destructive" size="sm">Revoke All Others</Button>
							</form>
						{/if}
					</div>
				</Card.Header>
				<Card.Content>
					<div class="space-y-4">
						{#each data.sessions as session}
							{@const ua = parseUserAgent(session.userAgent)}
							{@const isCurrent = session.id === data.currentSessionId}
							{@const DeviceIcon = getDeviceIcon(ua.device)}
							<div class="flex items-center justify-between rounded-lg border p-4">
								<div class="flex items-center gap-4">
									<div class="bg-muted flex size-10 items-center justify-center rounded-lg">
										<DeviceIcon class="text-muted-foreground size-5" />
									</div>
									<div>
										<div class="flex items-center gap-2">
											<span class="font-medium">{ua.browser} on {ua.os}</span>
											{#if isCurrent}
												<Badge variant="secondary">Current</Badge>
											{/if}
										</div>
										<div class="text-muted-foreground flex items-center gap-2 text-sm">
											<GlobeIcon class="size-3" />
											<span>{session.ipAddress ?? "Unknown IP"}</span>
											<span>·</span>
											<span>{timeAgo(session.createdAt)}</span>
										</div>
									</div>
								</div>
								{#if !isCurrent}
									<form method="POST" action="?/revokeSession" use:enhance>
										<input type="hidden" name="sessionId" value={session.id} />
										<Button type="submit" variant="outline" size="sm">Revoke</Button>
									</form>
								{/if}
							</div>
						{:else}
							<p class="text-muted-foreground text-center text-sm">No active sessions found.</p>
						{/each}
					</div>
				</Card.Content>
			</Card.Root>
		</Tabs.Content>

		<Tabs.Content value="notifications" class="space-y-6 pt-4">
			<Card.Root>
				<Card.Header>
					<Card.Title>Notification Preferences</Card.Title>
					<Card.Description>Choose which notifications you want to receive.</Card.Description>
				</Card.Header>
				<Card.Content>
					<form method="POST" action="?/updateNotificationPrefs" use:enhance class="space-y-4">
						{#each Object.entries(notifLabels) as [key, { label, description, icon: Icon }]}
							<div class="flex items-center justify-between rounded-lg border p-4">
								<div class="flex items-center gap-3">
									<Icon class="text-muted-foreground size-5" />
									<div>
										<Label>{label}</Label>
										<p class="text-muted-foreground text-xs">{description}</p>
									</div>
								</div>
								<Switch name={key} checked={data.notificationPrefs[key]} />
							</div>
						{/each}
						<Button type="submit">Save Preferences</Button>
					</form>
				</Card.Content>
			</Card.Root>
		</Tabs.Content>

		{#if data.isAdmin}
			<Tabs.Content value="application" class="space-y-6 pt-4">
				<Card.Root>
					<Card.Header>
						<Card.Title>Application Settings</Card.Title>
						<Card.Description>Configure global application settings. Admin only.</Card.Description>
					</Card.Header>
					<Card.Content>
						<form method="POST" action="?/updateSettings" use:enhance class="space-y-6">
							<div class="grid gap-2">
								<Label for="siteName">Site Name</Label>
								<Input id="siteName" name="siteName" value={data.settings.siteName} />
							</div>

							<div class="grid gap-2">
								<Label>Timezone</Label>
								<Select.Root name="timezone" type="single" value={data.settings.timezone}>
									<Select.Trigger>
										<span>{data.settings.timezone}</span>
									</Select.Trigger>
									<Select.Content>
										<Select.Item value="UTC">UTC</Select.Item>
										<Select.Item value="America/New_York">America/New_York</Select.Item>
										<Select.Item value="America/Chicago">America/Chicago</Select.Item>
										<Select.Item value="America/Denver">America/Denver</Select.Item>
										<Select.Item value="America/Los_Angeles">America/Los_Angeles</Select.Item>
										<Select.Item value="Europe/London">Europe/London</Select.Item>
										<Select.Item value="Europe/Berlin">Europe/Berlin</Select.Item>
										<Select.Item value="Asia/Tokyo">Asia/Tokyo</Select.Item>
									</Select.Content>
								</Select.Root>
							</div>

							<div class="grid gap-2">
								<Label>Default User Role</Label>
								<Select.Root name="defaultRole" type="single" value={data.settings.defaultRole}>
									<Select.Trigger>
										<span class="capitalize">{data.settings.defaultRole}</span>
									</Select.Trigger>
									<Select.Content>
										<Select.Item value="admin">Admin</Select.Item>
										<Select.Item value="editor">Editor</Select.Item>
										<Select.Item value="viewer">Viewer</Select.Item>
									</Select.Content>
								</Select.Root>
								<p class="text-muted-foreground text-xs">Role assigned to new users by default.</p>
							</div>

							<div class="flex items-center justify-between rounded-lg border p-4">
								<div class="space-y-0.5">
									<Label>Maintenance Mode</Label>
									<p class="text-muted-foreground text-xs">
										When enabled, non-admin users will see a maintenance page.
									</p>
								</div>
								<Switch name="maintenanceMode" checked={data.settings.maintenanceMode === "true"} />
							</div>

							<Button type="submit">Save Settings</Button>
						</form>
					</Card.Content>
				</Card.Root>
			</Tabs.Content>
		{/if}
	</Tabs.Root>
</div>
