import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260827201241 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "blog_tag" drop constraint if exists "blog_tag_slug_unique";`);
    this.addSql(`alter table if exists "blog_post" drop constraint if exists "blog_post_slug_unique";`);
    this.addSql(`alter table if exists "blog_category" drop constraint if exists "blog_category_slug_unique";`);
    this.addSql(`create table if not exists "blog_category" ("id" text not null, "name" text not null, "slug" text not null, "description" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "blog_category_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_blog_category_slug_unique" ON "blog_category" ("slug") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_blog_category_deleted_at" ON "blog_category" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "blog_post" ("id" text not null, "title" text not null, "slug" text not null, "excerpt" text null, "content" text not null, "status" text check ("status" in ('draft', 'published')) not null default 'draft', "published_at" timestamptz null, "featured_image" text null, "seo_title" text null, "seo_description" text null, "author_name" text null, "author_id" text null, "category_id" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "blog_post_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_blog_post_slug_unique" ON "blog_post" ("slug") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_blog_post_slug" ON "blog_post" ("slug") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_blog_post_status" ON "blog_post" ("status") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_blog_post_category_id" ON "blog_post" ("category_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_blog_post_deleted_at" ON "blog_post" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "blog_tag" ("id" text not null, "name" text not null, "slug" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "blog_tag_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_blog_tag_slug_unique" ON "blog_tag" ("slug") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_blog_tag_deleted_at" ON "blog_tag" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "blog_post_blog_tags" ("blog_post_id" text not null, "blog_tag_id" text not null, constraint "blog_post_blog_tags_pkey" primary key ("blog_post_id", "blog_tag_id"));`);

    this.addSql(`alter table if exists "blog_post" add constraint "blog_post_category_id_foreign" foreign key ("category_id") references "blog_category" ("id") on update cascade on delete set null;`);

    this.addSql(`alter table if exists "blog_post_blog_tags" add constraint "blog_post_blog_tags_blog_post_id_foreign" foreign key ("blog_post_id") references "blog_post" ("id") on update cascade on delete cascade;`);
    this.addSql(`alter table if exists "blog_post_blog_tags" add constraint "blog_post_blog_tags_blog_tag_id_foreign" foreign key ("blog_tag_id") references "blog_tag" ("id") on update cascade on delete cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "blog_post" drop constraint if exists "blog_post_category_id_foreign";`);

    this.addSql(`alter table if exists "blog_post_blog_tags" drop constraint if exists "blog_post_blog_tags_blog_post_id_foreign";`);

    this.addSql(`alter table if exists "blog_post_blog_tags" drop constraint if exists "blog_post_blog_tags_blog_tag_id_foreign";`);

    this.addSql(`drop table if exists "blog_category" cascade;`);

    this.addSql(`drop table if exists "blog_post" cascade;`);

    this.addSql(`drop table if exists "blog_tag" cascade;`);

    this.addSql(`drop table if exists "blog_post_blog_tags" cascade;`);
  }

}
