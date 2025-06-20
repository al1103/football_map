PGDMP                      }            football_fields_db    17.4    17.4     P           0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                           false            Q           0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                           false            R           0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                           false            S           1262    25049    football_fields_db    DATABASE     �   CREATE DATABASE football_fields_db WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'Vietnamese_Vietnam.1252';
 "   DROP DATABASE football_fields_db;
                     postgres    false                        3079    25083 	   uuid-ossp 	   EXTENSION     ?   CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;
    DROP EXTENSION "uuid-ossp";
                        false            T           0    0    EXTENSION "uuid-ossp"    COMMENT     W   COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';
                             false    2            �            1255    25144    update_updated_at_column()    FUNCTION     �   CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;
 1   DROP FUNCTION public.update_updated_at_column();
       public               postgres    false            �            1259    25111    fields    TABLE     �  CREATE TABLE public.fields (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    address character varying(255) NOT NULL,
    latitude numeric(10,8) NOT NULL,
    longitude numeric(11,8) NOT NULL,
    price_per_hour numeric(10,2),
    field_type character varying(20) DEFAULT '5vs5'::character varying,
    surface_type character varying(20) DEFAULT 'artificial'::character varying,
    has_lighting boolean DEFAULT false,
    has_parking boolean DEFAULT false,
    has_changing_room boolean DEFAULT false,
    has_shower boolean DEFAULT false,
    capacity integer DEFAULT 10,
    owner_id uuid,
    phone character varying(20),
    email character varying(100),
    website character varying(255),
    opening_hours jsonb,
    images character varying,
    amenities text[],
    rating numeric(3,2) DEFAULT 0.00,
    total_reviews integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT football_fields_field_type_check CHECK (((field_type)::text = ANY ((ARRAY['5vs5'::character varying, '7vs7'::character varying, '11vs11'::character varying, 'futsal'::character varying])::text[]))),
    CONSTRAINT football_fields_surface_type_check CHECK (((surface_type)::text = ANY ((ARRAY['grass'::character varying, 'artificial'::character varying, 'concrete'::character varying])::text[])))
);
    DROP TABLE public.fields;
       public         heap r       postgres    false    2            �            1259    25094    users    TABLE     �  CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    password character varying(255) NOT NULL,
    full_name character varying(100),
    phone character varying(20),
    avatar_url character varying(255),
    is_active boolean DEFAULT true,
    role character varying(20) DEFAULT 'user'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['user'::character varying, 'admin'::character varying, 'owner'::character varying])::text[])))
);
    DROP TABLE public.users;
       public         heap r       postgres    false    2            M          0    25111    fields 
   TABLE DATA           @  COPY public.fields (id, name, description, address, latitude, longitude, price_per_hour, field_type, surface_type, has_lighting, has_parking, has_changing_room, has_shower, capacity, owner_id, phone, email, website, opening_hours, images, amenities, rating, total_reviews, is_active, created_at, updated_at) FROM stdin;
    public               postgres    false    219   '#       L          0    25094    users 
   TABLE DATA           �   COPY public.users (id, username, email, password, full_name, phone, avatar_url, is_active, role, created_at, updated_at) FROM stdin;
    public               postgres    false    218   *       �           2606    25132    fields football_fields_pkey 
   CONSTRAINT     Y   ALTER TABLE ONLY public.fields
    ADD CONSTRAINT football_fields_pkey PRIMARY KEY (id);
 E   ALTER TABLE ONLY public.fields DROP CONSTRAINT football_fields_pkey;
       public                 postgres    false    219            �           2606    25110    users users_email_key 
   CONSTRAINT     Q   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);
 ?   ALTER TABLE ONLY public.users DROP CONSTRAINT users_email_key;
       public                 postgres    false    218            �           2606    25106    users users_pkey 
   CONSTRAINT     N   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);
 :   ALTER TABLE ONLY public.users DROP CONSTRAINT users_pkey;
       public                 postgres    false    218            �           2606    25108    users users_username_key 
   CONSTRAINT     W   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);
 B   ALTER TABLE ONLY public.users DROP CONSTRAINT users_username_key;
       public                 postgres    false    218            �           1259    25143    idx_fields_active    INDEX     I   CREATE INDEX idx_fields_active ON public.fields USING btree (is_active);
 %   DROP INDEX public.idx_fields_active;
       public                 postgres    false    219            �           1259    25140    idx_fields_location    INDEX     U   CREATE INDEX idx_fields_location ON public.fields USING btree (latitude, longitude);
 '   DROP INDEX public.idx_fields_location;
       public                 postgres    false    219    219            �           1259    25142    idx_fields_rating    INDEX     F   CREATE INDEX idx_fields_rating ON public.fields USING btree (rating);
 %   DROP INDEX public.idx_fields_rating;
       public                 postgres    false    219            �           1259    25141    idx_fields_type    INDEX     H   CREATE INDEX idx_fields_type ON public.fields USING btree (field_type);
 #   DROP INDEX public.idx_fields_type;
       public                 postgres    false    219            �           1259    25139    idx_users_email    INDEX     B   CREATE INDEX idx_users_email ON public.users USING btree (email);
 #   DROP INDEX public.idx_users_email;
       public                 postgres    false    218            �           1259    25138    idx_users_username    INDEX     H   CREATE INDEX idx_users_username ON public.users USING btree (username);
 &   DROP INDEX public.idx_users_username;
       public                 postgres    false    218            �           2620    25146    fields update_fields_updated_at    TRIGGER     �   CREATE TRIGGER update_fields_updated_at BEFORE UPDATE ON public.fields FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
 8   DROP TRIGGER update_fields_updated_at ON public.fields;
       public               postgres    false    230    219            �           2620    25145    users update_users_updated_at    TRIGGER     �   CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
 6   DROP TRIGGER update_users_updated_at ON public.users;
       public               postgres    false    230    218            �           2606    25133 $   fields football_fields_owner_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.fields
    ADD CONSTRAINT football_fields_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE SET NULL;
 N   ALTER TABLE ONLY public.fields DROP CONSTRAINT football_fields_owner_id_fkey;
       public               postgres    false    219    4783    218            M   H  x�͘ϋ���Ϛ���CN]�惘!��a6�;,d�䰗R�d���Ɩ{�	9��v�e	a	LO3�d!�\�}�����I^�v�d[�{��٪�%������
&co,vT̙�81���S*#i"�藳�%Jf�*�����z���e�΋������\�|>��@n>��y�Q�C���ͫ
�����5Lrvx������S^!������ }8{S���S;@��ӿ����w�c~��Χ)"Jz1�"�WDb�ӂ�z���=�&��"����
W�ӨZ�Iل�e��S��XgJa�)7^9McņPƅT:\�����UbOO{n8�>{��(�^���X��1��G��h0,���'��
T�t�1�V�Q{��o�|2��<���#�.ʫ�l|��a1��tܛ��S;��e=<ˇ�!�4Z���R��Tȟ>���'�#۬����nï��P��R:����胷�$WE��Cg:���ًy<�./�?��S4���}81��N) K4����ꄑ���4e l3D�!O��)0�4!:�&�NH,W/=��
�sMr?�߼��'�y�{9��*�m�.	������5\h������]g�5�UKf�^1���j+����:;���вMhY#�Z�Z�>h�hٞ�rm�W,��\���DZcͽ��FFjv��,��pЅ\���+�J�MֱK!��c���N���8#M@U ��.���S �\�I�8j����d������_���1Z��=#�*͗;l��f�(kn����\�U�ʺ6eOem�jCڈ�)#�rXI&V�4!>u��ҧ�q?�3ڭ��g W�`&�4����1`R��@�	#�#��ķ��� ��18u��ݿ���˟�A� ]���÷?94��h�9��;Ԇ�򆀚۝n4��hf�j�L��r�6�ؘ,��T�R��th.�4�)�CR��>
J��l��l*(�g��-
Jv�>�λ*�Ub�'�{P�jy	eaHm�!���s��K�s�r��`#t�cm�*��L�����������j����Eg�
����ώ�o���{4�]Uh �5���%o;_����U�'�0	L�%�1�XK�`j� 2�5�\bGA0��'���l����wR���d����oӸ�ѷM��~�.13e<ɬJv 	���%4�\�e�&i��vK�S�&a;{9�2a��+T�ǫj��:h�eD�շ��)k�;f�^��$v�^��qe���NǕݎ+�W�p\yG�J�]1F�P��L�$e3wigVڶJ�Z���E%:2��j>!3��k9Zxa�1Ou����aN[O�kՃ�r��	�l��B햊4�u���U��/�t�:�{sz�piQ����u�vb��.\���|b�cë��Fd�Į�{5"�n�a��Vb��F���fgSsRKC��K��(n8�$e�v�^�ePE�"c�����E����p>��9x^��C��u�]�Y3⅃���n�����JJ�;�ͺ���x|�溲���.����^�t��5�l�.��ⓚE�S�w�)M�T2&(�s�"�ڧ)�6#Lˌ[�[ݴ-�c��Ԯ��:�Tc{�Y5�?�����t(����Y�>̆f��r�L�s���n�V�},>�Ebk�ڍ��Z�Q]K��6�6eO�o�j#ڈ�(��SɰbV��&&���d�� 9_@d!����.��dH��%iʵ���X��bN�$5\��z/��&�Z���}��-��e��6,�l���� �c���Ь�b��Ex�7E���Q���/W�O���m���}�o�WEȻV�Y{;@?6�-M������%W��Y��������      L   �  x��Խn�@���.��z<ޏT�"���4�k��p�F�(uDE� �(�]y��7�>��H��+�_?��7\a�πb&Ak����tI�""�٢�]=tU�2z>�l��h�1+|������7�lyz��˓2z�S��z��g��Ϗ&QUL�
��,�pRep��7?|�Z����rw��X�	�\�`�#�F!I|�T$1I����6��sDN$H�tB �ʄ��dP}��2��a��� �i�����|���ʇ�ZV��kwK�C-�*VX�s���f�dM�$�����:_֛�><�����g�w��Ä̌"�Jq� �6�
�9:T�$}
v��OJ?�����_}Ѹz��s+sh��7.�A�$!�NZ�7!����v�u(��Y����v��K��eV��;V�wKU��<I3cm3-�Ș!����C7Z��Ǯ�zT����_�cݾ���w6]D���E�l�     