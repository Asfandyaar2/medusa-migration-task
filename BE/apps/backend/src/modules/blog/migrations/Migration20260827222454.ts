import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260827222454 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`drop table if exists "blog_post_blog_tags" cascade;`);

    this.addSql(`alter table if exists "blog_post" add column if not exists "tag_ids" jsonb null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`create table if not exists "blog_post_blog_tags" ("blog_post_id" text not null, "blog_tag_id" text not null, constraint "blog_post_blog_tags_pkey" primary key ("blog_post_id", "blog_tag_id"));`);

    this.addSql(`alter table if exists "blog_post_blog_tags" add constraint "blog_post_blog_tags_blog_post_id_foreign" foreign key ("blog_post_id") references "blog_post" ("id") on update cascade on delete cascade;`);
    this.addSql(`alter table if exists "blog_post_blog_tags" add constraint "blog_post_blog_tags_blog_tag_id_foreign" foreign key ("blog_tag_id") references "blog_tag" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table if exists "blog_post" drop column if exists "tag_ids";`);
  }

}
