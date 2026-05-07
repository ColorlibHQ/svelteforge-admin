<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";
	import CheckIcon from "@lucide/svelte/icons/check";
	import XIcon from "@lucide/svelte/icons/x";

	const plans = [
		{
			name: "Free",
			price: "$0",
			period: "forever",
			description: "Get started with the basics",
			features: [
				{ name: "Up to 5 users", included: true },
				{ name: "10 pages", included: true },
				{ name: "Basic analytics", included: true },
				{ name: "Email notifications", included: true },
				{ name: "Custom roles", included: false },
				{ name: "API access", included: false },
				{ name: "Priority support", included: false },
				{ name: "SSO integration", included: false },
			],
			cta: "Get Started",
			popular: false,
		},
		{
			name: "Pro",
			price: "$29",
			period: "per month",
			description: "For growing teams and businesses",
			features: [
				{ name: "Up to 50 users", included: true },
				{ name: "Unlimited pages", included: true },
				{ name: "Advanced analytics", included: true },
				{ name: "Email notifications", included: true },
				{ name: "Custom roles", included: true },
				{ name: "API access", included: true },
				{ name: "Priority support", included: false },
				{ name: "SSO integration", included: false },
			],
			cta: "Start Free Trial",
			popular: true,
		},
		{
			name: "Enterprise",
			price: "$99",
			period: "per month",
			description: "For large organizations",
			features: [
				{ name: "Unlimited users", included: true },
				{ name: "Unlimited pages", included: true },
				{ name: "Advanced analytics", included: true },
				{ name: "Email notifications", included: true },
				{ name: "Custom roles", included: true },
				{ name: "API access", included: true },
				{ name: "Priority support", included: true },
				{ name: "SSO integration", included: true },
			],
			cta: "Contact Sales",
			popular: false,
		},
	];
</script>

<svelte:head>
	<title>Pricing - SvelteForge Admin</title>
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-16">
	<div class="mb-12 text-center">
		<h1 class="text-4xl font-bold tracking-tight">Simple, transparent pricing</h1>
		<p class="text-muted-foreground mt-4 text-lg">
			Choose the plan that fits your team. All plans include a 14-day free trial.
		</p>
	</div>

	<div class="grid gap-8 md:grid-cols-3">
		{#each plans as plan}
			<Card.Root class="{plan.popular ? 'border-primary shadow-lg' : ''} relative">
				{#if plan.popular}
					<div class="absolute -top-3 left-1/2 -translate-x-1/2">
						<Badge>Most Popular</Badge>
					</div>
				{/if}
				<Card.Header class="text-center">
					<Card.Title class="text-xl">{plan.name}</Card.Title>
					<Card.Description>{plan.description}</Card.Description>
					<div class="pt-4">
						<span class="text-4xl font-bold">{plan.price}</span>
						<span class="text-muted-foreground text-sm">/{plan.period}</span>
					</div>
				</Card.Header>
				<Card.Content>
					<Separator class="mb-6" />
					<ul class="space-y-3">
						{#each plan.features as feature}
							<li class="flex items-center gap-3">
								{#if feature.included}
									<CheckIcon class="text-primary size-4 shrink-0" />
									<span class="text-sm">{feature.name}</span>
								{:else}
									<XIcon class="text-muted-foreground size-4 shrink-0" />
									<span class="text-muted-foreground text-sm">{feature.name}</span>
								{/if}
							</li>
						{/each}
					</ul>
				</Card.Content>
				<Card.Footer>
					<Button class="w-full" variant={plan.popular ? "default" : "outline"} href="/register">
						{plan.cta}
					</Button>
				</Card.Footer>
			</Card.Root>
		{/each}
	</div>
</div>
