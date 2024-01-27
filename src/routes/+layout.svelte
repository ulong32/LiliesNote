<script lang="ts">
    import "../app.postcss";

    // Floating UI for Popups
    import {
        computePosition,
        autoUpdate,
        flip,
        shift,
        offset,
        arrow,
    } from "@floating-ui/dom";
    import { AppShell, storePopup } from "@skeletonlabs/skeleton";
    storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });
    import Header from "$lib/components/Header.svelte";
	import Footer from "$lib/components/Footer.svelte";


    import { initializeStores } from '@skeletonlabs/skeleton';
    initializeStores();
    import { Toast } from '@skeletonlabs/skeleton';
</script>

<Toast background="variant-filled-surface" />
<AppShell class="min-h-screen">
    <svelte:fragment slot="header"><Header /></svelte:fragment>
	<slot />
	<svelte:fragment slot="pageFooter"><Footer /></svelte:fragment>
</AppShell>


