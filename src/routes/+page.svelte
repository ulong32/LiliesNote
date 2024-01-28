<script lang="ts">
    import { onMount } from "svelte";

    import { Stepper, Step } from "@skeletonlabs/skeleton";
    import { TreeView, TreeViewItem } from "@skeletonlabs/skeleton";
    import { ListBox, ListBoxItem } from "@skeletonlabs/skeleton";

    import { type lilyBirthdayObject } from "$lib/types";
    import { filterByGarden } from "$lib/filters";
    import { Table, tableMapperValues } from "@skeletonlabs/skeleton";
    import type { TableSource } from "@skeletonlabs/skeleton";
    import { ProgressRadial } from "@skeletonlabs/skeleton";

    import { buildCalendar } from "$lib/buildCalendar";

    import { getToastStore } from "@skeletonlabs/skeleton";
    import type { ToastSettings } from "@skeletonlabs/skeleton";

    let isLoaded = false;
    //クエリ本体
    const query = `PREFIX schema: <http://schema.org/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX lily: <https://luciadb.assaultlily.com/rdf/IRIs/lily_schema.ttl#>
SELECT ?name ?birthdate ?lgname ?lily ?type ?garden
WHERE {
    VALUES ?class { lily:Lily lily:Teacher lily:Madec lily:Character }
    ?lily a ?class;
          rdf:type ?type;
          schema:name ?name;
          schema:birthDate ?birthdate.
    FILTER(lang(?name)="ja")
    OPTIONAL{
        ?lily lily:legion/schema:name ?lgname.
        FILTER(lang(?lgname)="ja")
    }
    OPTIONAL{?lily lily:garden ?garden.}
}
ORDER BY ?birthdate`.replace(/\n +/g, "");

    let selectedLilyList: lilyBirthdayObject[] = [];
    let lilyBirthdayObjects: lilyBirthdayObject[] = [];
    let gardenList: Set<string> = new Set();
    onMount(() => {
        fetch(
            `https://luciadb.assaultlily.com/sparql/query?format=json&query=${encodeURIComponent(
                query
            )}`
        )
            .then((r) => r.json())
            .then((returnedObject) => {
                lilyBirthdayObjects = returnedObject.results.bindings;
                //console.table(lilyBirthdayObjects)
                gardenList = new Set(
                    lilyBirthdayObjects.map((obj) => {
                        if ("garden" in obj) {
                            return obj.garden!.value;
                        } else {
                            return "所属ガーデンなし";
                        }
                    })
                );
                selectedLilyList = filterByGarden(
                    lilyBirthdayObjects,
                    selectedGardenList
                );
                isLoaded = true;
            });
    });

    let selectedGardenList: string[] = [];
    $: selectedLilyList = filterByGarden(
        lilyBirthdayObjects,
        selectedGardenList
    );
    $: selectedLilyValueList = selectedLilyList.map(({ name, birthdate }) => ({
        name: name.value,
        birthdate:
            birthdate.value.slice(2, 4) +
            "月" +
            birthdate.value.slice(5, 7) +
            "日",
    }));
    let selectedTableSource: TableSource | undefined = undefined;
    $: if (selectedLilyValueList.length > 0) {
        selectedTableSource = {
            head: ["名前", "誕生日"],
            body: tableMapperValues(selectedLilyValueList, [
                "name",
                "birthdate",
            ]),
        };
    }

    let labelExport = "エクスポート";
    const toastStore = getToastStore();
    function invokeToast() {
        labelExport = "生成中...";
        const t: ToastSettings = {
            message: "エクスポートするデータを生成しています...",
            hideDismiss: true,
            timeout: 2000,
        };
        toastStore.trigger(t);
        buildCalendar(selectedLilyList);
        labelExport = "エクスポート";
        return undefined;
    }
</script>

<div class="container mx-auto flex justify-center items-center">
    <div class="card p-4 m-4 w-full">
        {#if !isLoaded}
            <ProgressRadial class="mx-auto my-4" />
        {:else}
            <Stepper
                buttonBackLabel="← 戻る"
                buttonNextLabel="進む →"
                buttonCompleteLabel={labelExport}
                on:complete={invokeToast}
            >
                <Step>
                    <svelte:fragment slot="header">フィルター</svelte:fragment>
                    <span>フィルターを行います。</span>
                    <TreeView>
                        <TreeViewItem>
                            ガーデンでフィルタ
                            <svelte:fragment slot="children">
                                <ListBox multiple>
                                    {#each Array.from(gardenList) as item}
                                        <ListBoxItem
                                            bind:group={selectedGardenList}
                                            name="medium"
                                            value={item}
                                        >
                                            {item} - {filterByGarden(
                                                lilyBirthdayObjects,
                                                [item]
                                            ).length}人
                                        </ListBoxItem>
                                    {/each}
                                </ListBox>
                            </svelte:fragment>
                        </TreeViewItem>
                    </TreeView>
                    <div class="p-2">
                        現在 {selectedLilyList.length} 人のリリィが選択されています。
                    </div>
                </Step>
                <Step>
                    <svelte:fragment slot="header">確認</svelte:fragment>
                    以下の内容でエクスポートします。よろしいですか？
                    {#if selectedTableSource}
                        <Table source={selectedTableSource} />
                    {/if}
                </Step>
                <Step>
                    <svelte:fragment slot="header">
                        エクスポート
                    </svelte:fragment>
                    <span>
                        カレンダーデータのエクスポートを行います。下の「エクスポート」ボタンを押してください。
                    </span>
                </Step>
            </Stepper>
        {/if}
    </div>
</div>
