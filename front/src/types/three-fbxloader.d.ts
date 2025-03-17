declare module "three/examples/jsm/loaders/FBXLoader" {
    import { Loader, LoadingManager, Group } from "three";

    export class FBXLoader extends Loader {
        constructor(manager?: LoadingManager);
        load(
            url: string,
            onLoad: (object: Group) => void,
            onProgress?: (event: ProgressEvent<EventTarget>) => void,
            onError?: (event: ErrorEvent) => void
        ): void;
        parse(data: ArrayBuffer | string): Group;
    }
}