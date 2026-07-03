import { PostV1_1_0 } from '@/application/UpdateService/post-update/PostV1_1_0';
import { PostV1_1_2 } from '@/application/UpdateService/post-update/PostV1_1_2';
import type {
  PostUpdateChangeClass,
  PostUpdateChange,
} from '@/application/UpdateService/post-update/PostUpdateChange';

export const postUpdateChanges: PostUpdateChangeClass[] = [
  PostV1_1_0,
  PostV1_1_2,
];
export { PostUpdateChangeClass, PostUpdateChange };
