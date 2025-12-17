--
-- PostgreSQL database dump
--

\restrict WAf8YNYUvUBlf0SElpPkDbBmt71XRBwEbjQLohTujOAPtylTS6kf9yc4MGHZG1D

-- Dumped from database version 17.7 (Debian 17.7-3.pgdg13+1)
-- Dumped by pg_dump version 17.7

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Address; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Address" (
    id text NOT NULL,
    type text NOT NULL,
    line1 text NOT NULL,
    line2 text,
    city text NOT NULL,
    state text,
    "zipCode" text,
    country text NOT NULL,
    "thirdPartyId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Address" OWNER TO postgres;

--
-- Name: Contact; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Contact" (
    id text NOT NULL,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    email text,
    phone text,
    mobile text,
    fax text,
    role text,
    "thirdPartyId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Contact" OWNER TO postgres;

--
-- Name: ContactType; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ContactType" (
    id text NOT NULL,
    name text NOT NULL,
    category text DEFAULT 'Client'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ContactType" OWNER TO postgres;

--
-- Name: Currency; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Currency" (
    id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    symbol text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Currency" OWNER TO postgres;

--
-- Name: Equipment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Equipment" (
    id text NOT NULL,
    name text NOT NULL,
    "internalId" text,
    "serialNumber" text,
    "accountingCode" text,
    brand text,
    model text,
    status text DEFAULT 'Active'::text NOT NULL,
    "categoryId" text,
    "siteId" text,
    supplier text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Equipment" OWNER TO postgres;

--
-- Name: EquipmentCategory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."EquipmentCategory" (
    id text NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."EquipmentCategory" OWNER TO postgres;

--
-- Name: Incoterm; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Incoterm" (
    id text NOT NULL,
    name text NOT NULL,
    "xmlCode" text NOT NULL,
    "requiresText" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Incoterm" OWNER TO postgres;

--
-- Name: Language; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Language" (
    id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Language" OWNER TO postgres;

--
-- Name: MaintenanceSite; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."MaintenanceSite" (
    id text NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."MaintenanceSite" OWNER TO postgres;

--
-- Name: Material; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Material" (
    id text NOT NULL,
    name text NOT NULL,
    category text DEFAULT 'Stone'::text NOT NULL,
    type text NOT NULL,
    "purchasePrice" double precision DEFAULT 0 NOT NULL,
    "sellingPrice" double precision,
    unit text DEFAULT 'sqft'::text NOT NULL,
    density double precision,
    "wasteFactor" double precision DEFAULT 4 NOT NULL,
    "densityUnit" text DEFAULT 'lb/ft3'::text NOT NULL,
    quality text DEFAULT 'S'::text NOT NULL,
    "syncStatus" text DEFAULT 'DRAFT'::text NOT NULL,
    "validityDuration" integer,
    "sellingUnit" text DEFAULT 'sqft'::text NOT NULL,
    "imageUrl" text,
    "supplierId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Material" OWNER TO postgres;

--
-- Name: Part; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Part" (
    id text NOT NULL,
    name text NOT NULL,
    reference text,
    description text,
    note text,
    supplier text,
    "stockQuantity" double precision DEFAULT 0 NOT NULL,
    "minQuantity" double precision DEFAULT 0 NOT NULL,
    "reqQuantity" double precision DEFAULT 0 NOT NULL,
    "orderedQuantity" double precision DEFAULT 0 NOT NULL,
    "categoryId" text,
    "siteId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Part" OWNER TO postgres;

--
-- Name: PartCategory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PartCategory" (
    id text NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PartCategory" OWNER TO postgres;

--
-- Name: PaymentTerm; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PaymentTerm" (
    id text NOT NULL,
    code integer NOT NULL,
    label_en text NOT NULL,
    label_fr text NOT NULL,
    days integer DEFAULT 0 NOT NULL,
    "depositPercentage" double precision DEFAULT 0 NOT NULL,
    "discountPercentage" double precision DEFAULT 0 NOT NULL,
    "discountDays" integer DEFAULT 0 NOT NULL,
    "requiresText" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PaymentTerm" OWNER TO postgres;

--
-- Name: ProductionSite; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ProductionSite" (
    id text NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ProductionSite" OWNER TO postgres;

--
-- Name: Project; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Project" (
    id text NOT NULL,
    name text NOT NULL,
    reference text NOT NULL,
    status text NOT NULL,
    "thirdPartyId" text,
    "locationId" text,
    "measureSystem" text DEFAULT 'Imperial'::text NOT NULL,
    "estimatedWeeks" integer,
    "numberOfLines" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Project" OWNER TO postgres;

--
-- Name: ProjectLocation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ProjectLocation" (
    id text NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ProjectLocation" OWNER TO postgres;

--
-- Name: Quote; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Quote" (
    id text NOT NULL,
    reference text NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    currency text DEFAULT 'CAD'::text NOT NULL,
    "exchangeRate" double precision DEFAULT 1.0,
    incoterm text DEFAULT 'Ex Works'::text,
    "incotermId" text,
    "incotermCustomText" text,
    "semiStandardRate" double precision,
    "salesCurrency" text,
    "palletPrice" double precision,
    "palletRequired" boolean,
    "paymentTermId" text,
    "paymentDays" integer,
    "depositPercentage" double precision,
    "discountPercentage" double precision,
    "paymentCustomText" text,
    status text DEFAULT 'Draft'::text NOT NULL,
    "projectId" text NOT NULL,
    "thirdPartyId" text NOT NULL,
    "contactId" text,
    "materialId" text,
    "dateIssued" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "validUntil" timestamp(3) without time zone,
    "totalAmount" double precision DEFAULT 0 NOT NULL,
    "estimatedWeeks" integer,
    "excelFilePath" text,
    "syncStatus" text,
    "odooId" text,
    "odooStatus" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "discountDays" integer,
    "validityDuration" integer,
    "representativeId" text
);


ALTER TABLE public."Quote" OWNER TO postgres;

--
-- Name: QuoteItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."QuoteItem" (
    id text NOT NULL,
    "quoteId" text NOT NULL,
    tag text,
    "lineNo" text,
    "refReference" text,
    product text,
    description text NOT NULL,
    material text NOT NULL,
    finish text,
    unit text,
    length double precision,
    width double precision,
    thickness double precision,
    quantity double precision DEFAULT 1 NOT NULL,
    "numHoles" integer DEFAULT 0 NOT NULL,
    "numSlots" integer DEFAULT 0 NOT NULL,
    "netLength" double precision DEFAULT 0 NOT NULL,
    "netArea" double precision DEFAULT 0 NOT NULL,
    "netVolume" double precision DEFAULT 0 NOT NULL,
    "totalWeight" double precision DEFAULT 0 NOT NULL,
    "unitPrice" double precision DEFAULT 0 NOT NULL,
    "totalPrice" double precision DEFAULT 0 NOT NULL,
    "unitPriceInternal" double precision DEFAULT 0 NOT NULL,
    "totalPriceInternal" double precision DEFAULT 0 NOT NULL,
    "unitPriceCad" double precision DEFAULT 0 NOT NULL,
    "unitPriceUsd" double precision DEFAULT 0 NOT NULL,
    "totalPriceCad" double precision DEFAULT 0 NOT NULL,
    "totalPriceUsd" double precision DEFAULT 0 NOT NULL,
    "stoneValue" double precision DEFAULT 0 NOT NULL,
    "primarySawingCost" double precision DEFAULT 0 NOT NULL,
    "secondarySawingCost" double precision DEFAULT 0 NOT NULL,
    "profilingCost" double precision DEFAULT 0 NOT NULL,
    "finishingCost" double precision DEFAULT 0 NOT NULL,
    "anchoringCost" double precision DEFAULT 0 NOT NULL,
    "unitTime" double precision DEFAULT 0 NOT NULL,
    "totalTime" double precision DEFAULT 0 NOT NULL,
    "productionStatus" text DEFAULT 'Pending'::text NOT NULL,
    "productionSiteId" text,
    "productionNotes" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."QuoteItem" OWNER TO postgres;

--
-- Name: RepairPart; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."RepairPart" (
    id text NOT NULL,
    "repairRequestId" text NOT NULL,
    "partId" text NOT NULL,
    quantity double precision DEFAULT 1 NOT NULL,
    action text DEFAULT 'USE'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."RepairPart" OWNER TO postgres;

--
-- Name: RepairRequest; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."RepairRequest" (
    id text NOT NULL,
    reference text,
    "equipmentId" text,
    title text,
    description text NOT NULL,
    priority text DEFAULT 'Normal'::text NOT NULL,
    status text DEFAULT 'Open'::text NOT NULL,
    requester text,
    mechanic text,
    "isMachineDown" boolean DEFAULT false NOT NULL,
    "isFunctional" boolean DEFAULT true NOT NULL,
    "detectionDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP,
    "dueDate" timestamp(3) without time zone,
    "closedAt" timestamp(3) without time zone,
    type text DEFAULT 'Repair'::text NOT NULL,
    "recurrenceFreq" text,
    "recurrenceDay" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."RepairRequest" OWNER TO postgres;

--
-- Name: Representative; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Representative" (
    id text NOT NULL,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    email text,
    phone text,
    mobile text,
    fax text,
    active boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Representative" OWNER TO postgres;

--
-- Name: Setting; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Setting" (
    id text NOT NULL,
    key text NOT NULL,
    value text NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Setting" OWNER TO postgres;

--
-- Name: SystemConfig; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SystemConfig" (
    id text NOT NULL,
    key text DEFAULT 'GLOBAL'::text NOT NULL,
    "defaultSemiStandardRate" double precision DEFAULT 0.4 NOT NULL,
    "defaultSalesCurrency" text DEFAULT 'CAD'::text NOT NULL,
    "defaultPalletPrice" double precision DEFAULT 50.0 NOT NULL,
    "defaultPalletRequired" boolean DEFAULT false NOT NULL,
    "defaultPaymentDays" integer DEFAULT 30 NOT NULL,
    "defaultDepositPercentage" double precision DEFAULT 0 NOT NULL,
    "defaultDiscountPercentage" double precision DEFAULT 0 NOT NULL,
    "defaultDiscountDays" integer DEFAULT 10 NOT NULL,
    "defaultExchangeRate" double precision DEFAULT 1.0 NOT NULL,
    "defaultPaymentTermId" text,
    "taxRateTPS" double precision DEFAULT 5.0 NOT NULL,
    "taxRateTVQ" double precision DEFAULT 9.975 NOT NULL,
    "taxRateTVH" double precision DEFAULT 13.0 NOT NULL,
    "taxRateTVH_Maritimes" double precision DEFAULT 15.0 NOT NULL,
    "defaultMeasureUnit" text DEFAULT 'an'::text NOT NULL,
    "defaultValidityDuration" integer DEFAULT 30 NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SystemConfig" OWNER TO postgres;

--
-- Name: ThirdParty; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ThirdParty" (
    id text NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    code text,
    email text,
    phone text,
    fax text,
    website text,
    "defaultCurrency" text DEFAULT 'CAD'::text NOT NULL,
    "paymentTerms" text,
    "paymentTermId" text,
    "paymentDays" integer DEFAULT 0 NOT NULL,
    "depositPercentage" double precision DEFAULT 0 NOT NULL,
    "discountPercentage" double precision DEFAULT 0 NOT NULL,
    "discountDays" integer DEFAULT 0 NOT NULL,
    "paymentCustomText" text,
    "supplierType" text,
    "taxScheme" text,
    "creditLimit" double precision,
    "repName" text,
    language text DEFAULT 'fr'::text NOT NULL,
    "unitSystem" text DEFAULT 'Imperial'::text NOT NULL,
    incoterm text,
    "incotermId" text,
    "incotermCustomText" text,
    "priceListUrl" text,
    "priceListDate" text,
    "semiStandardRate" double precision,
    "salesCurrency" text,
    "palletPrice" double precision,
    "palletRequired" boolean,
    "internalNotes" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "exchangeRate" double precision,
    "validityDuration" integer
);


ALTER TABLE public."ThirdParty" OWNER TO postgres;

--
-- Data for Name: Address; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Address" (id, type, line1, line2, city, state, "zipCode", country, "thirdPartyId", "createdAt", "updatedAt") FROM stdin;
64265bc3-eccb-4562-99c6-a03e7c175f1e	Main	123 Rue Principale	\N	Montr├®al	QC	H1A 1A1	Canada	a7a8ab30-b59c-42e3-815b-e15021300db0	2025-12-13 01:43:39.225	2025-12-14 16:13:47.264
1175b9ee-5256-459c-b2dd-e5b18b7fa15f	Main	564 rue principale	\N	Notre-Dame-De-Montauban	QC	G0X1W1	Canada	5501fae5-5dd9-4ea8-ba80-386f53230d97	2025-12-13 02:18:32.257	2025-12-13 19:03:08.287
1e655afd-d216-4cc0-b803-89b3573d07b8	Main	76 rue Saint-Paul suite 100	\N	Qu├®bec City	QC	G1K3V9	Canada	d62a2e24-ddd6-486f-9ba3-3ceab2750f29	2025-12-13 02:25:32.25	2025-12-13 18:05:24.535
9d5f8b2b-3e6f-4069-b436-cd63b7b47778	Main	2 rue Junction	\N	Stanstead	QC	J0B1E0	Canada	b24310d9-56e8-450b-9fca-1fd214ac39bc	2025-12-13 02:30:04.965	2025-12-13 18:04:45.108
c56d667f-6fe1-4d4e-8727-08978ab5ec17	Main	One Stowe Street, suite 3	\N	Waterbury	VT	05676	├ëtats-Unis	3289b663-9736-42da-957c-49ba632dbe59	2025-12-13 18:37:26.965	2025-12-13 21:13:03.836
7e2b45fc-796a-4256-9088-842a67517804	Main	123 Rue Principale	\N	Montr├®al	QC	H1A 1A1	Canada	adea804f-3ccc-4e9b-9034-7c0f79be6e0e	2025-12-17 16:04:49.68	2025-12-17 16:04:49.68
c960c5cd-8230-4803-ba6c-e1251f28200d	Main	999 Quarry Road	\N	Vermont	\N	\N	USA	59c931e9-7959-4d4d-b0fb-6b3183bfb1ea	2025-12-17 16:04:50.992	2025-12-17 16:04:50.992
\.


--
-- Data for Name: Contact; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Contact" (id, "firstName", "lastName", email, phone, mobile, fax, role, "thirdPartyId", "createdAt", "updatedAt") FROM stdin;
ea1ace0b-5219-492e-8607-0a6a37906618	Marie	Curie	marie@constructionexemplaire.com	+1 (434) 343-4322	+1 (434) 743-7234		Charg├® de projet	a7a8ab30-b59c-42e3-815b-e15021300db0	2025-12-13 01:43:39.225	2025-12-14 16:23:39.284
3889e4c7-699f-4855-9a00-81c0aed80b05	Franck	Exemplaire	franck@granitedr.com	+1 (636) 732-7633	+1 (232) 323-2333		Charg├® de projet	a7a8ab30-b59c-42e3-815b-e15021300db0	2025-12-13 02:16:15.87	2025-12-13 02:16:15.87
86229544-8997-4a7b-b0f7-e09925611e69	Ren├®	Carrier	excmontauban@gmail.com	+1 (418) 336-2525	+1 (418) 507-8400		Charg├® de projet	5501fae5-5dd9-4ea8-ba80-386f53230d97	2025-12-13 02:20:14.146	2025-12-13 02:20:14.146
7fffa136-1978-4703-a95f-6c6c70be2b51	Etienne	Carrier	etienne@granitedrc.com	+1 (418) 535-3535	+1 (383) 838-3833		Architecte	5501fae5-5dd9-4ea8-ba80-386f53230d97	2025-12-13 02:20:39.104	2025-12-13 02:20:39.104
18673375-3ae8-41ed-ba4a-cc891356719e	Jeff	Lemieux	jeff.LEMIEUX@polycor.com	+1 (418) 692-4426	+1 (418) 575-2615		Directeur des ventes	d62a2e24-ddd6-486f-9ba3-3ceab2750f29	2025-12-13 02:26:53.609	2025-12-13 02:26:53.609
907af138-324b-4052-9b4b-f67d06ca25ab	Francois	Sansfacon	francois.sansfacon@polycor.com	+1 (418) 692-4695	+1 (418) 803-4195		Vendeur	d62a2e24-ddd6-486f-9ba3-3ceab2750f29	2025-12-13 02:28:03.725	2025-12-13 02:28:03.725
61c880dc-f202-4fb6-8ec0-9da8559c9484	Roger	Quirrion	rquirion@vermontstoneart.com	+1 (802) 505-2517	+1 (802) 505-2517		Directeur G├®n├®rale	3289b663-9736-42da-957c-49ba632dbe59	2025-12-13 18:39:32.392	2025-12-13 18:39:39.428
32bfeaa5-5558-4422-a7ad-78ac0c159e46	Whitney	Fellows	wfellows@vermontstoneart.com	+1 (802) 505-2507	+1 (802) 505-2507		Directeur de vente	3289b663-9736-42da-957c-49ba632dbe59	2025-12-13 18:40:21.858	2025-12-13 18:40:21.858
1eda46ff-dda3-4e3e-b5a5-49acfbfd6d37	Marie	Curie	marie@constructionexemplaire.com	450-555-5678	\N	\N	Architecte	adea804f-3ccc-4e9b-9034-7c0f79be6e0e	2025-12-17 16:04:49.68	2025-12-17 16:04:49.68
\.


--
-- Data for Name: ContactType; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ContactType" (id, name, category, "createdAt", "updatedAt") FROM stdin;
9b3d0350-64e6-4290-b971-829ef3defcf2	Architecte	Client	2025-12-13 01:43:39.216	2025-12-13 01:43:39.216
b92c49ba-a165-4212-b430-d6b242bab54a	Designer	Client	2025-12-13 01:43:39.217	2025-12-13 01:43:39.217
4f1da095-754c-4ea9-9f7d-8423c6eccac4	Charg├® de projet	Client	2025-12-13 01:43:39.218	2025-12-13 01:43:39.218
66df6b0e-f7b3-4473-9488-ca90501451d5	Comptabilit├®	Client	2025-12-13 01:43:39.219	2025-12-13 01:43:39.219
9697e30d-18ee-41c6-9d5a-e61ac5ca0b6c	G├®rant de chantier	Client	2025-12-13 01:43:39.219	2025-12-13 01:43:39.219
237da3cf-25d1-49e6-9ab0-cca2534423bf	Vendeur	Client	2025-12-13 01:43:39.219	2025-12-13 01:43:39.219
69e42a48-0580-459a-b7fd-1ff6e282c007	Directeur de vente	Client	2025-12-13 01:43:39.22	2025-12-13 01:43:39.22
5292fa84-3072-4fab-a32a-ae0a289185a0	Technicien	Client	2025-12-13 01:43:39.221	2025-12-13 01:43:39.221
5f9e9e5a-daf3-43f7-8116-0e8b1d5ab88c	Vendeur	Supplier	2025-12-13 02:04:14.476	2025-12-13 02:04:14.476
0f453fb6-7e8e-4384-a609-eda9548edc3f	Directeur des ventes	Supplier	2025-12-13 02:04:21.499	2025-12-13 02:04:21.499
4202361f-9b28-4fc3-a6d9-933b7a1e237d	Directeur G├®n├®rale	Client	2025-12-13 18:38:41.201	2025-12-13 18:38:41.201
\.


--
-- Data for Name: Currency; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Currency" (id, code, name, symbol, "createdAt", "updatedAt") FROM stdin;
2bf79548-1df6-4aeb-816e-149108c53d20	CAD	Dollar Canadien	$	2025-12-13 01:43:39.228	2025-12-13 01:43:39.228
056b78f6-3bc5-427a-967d-ef4817dcf084	USD	Dollar Am├®ricain	US$	2025-12-13 01:43:39.228	2025-12-13 01:43:39.228
\.


--
-- Data for Name: Equipment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Equipment" (id, name, "internalId", "serialNumber", "accountingCode", brand, model, status, "categoryId", "siteId", supplier, "createdAt", "updatedAt") FROM stdin;
b2bd9832-57b0-435e-b237-0c1a96a631f3	compresseur Denver	EQ-0042	602	6348602	\N	\N	Active	5efdc26d-8337-4321-9a0d-2e05fdacbcbc	64d8e2f6-bd3c-46a3-86a1-46ad99a1adec		2025-12-17 16:07:31.019	2025-12-17 16:07:31.019
f4c19275-414f-4c0a-883f-6a784b97ac06	G├®n├®ratrice Caterpillar 1999	EQ-0043	603	6348603	\N	\N	Active	f1bb23dd-9e0f-4755-b564-696463aa58a6	64d8e2f6-bd3c-46a3-86a1-46ad99a1adec		2025-12-17 16:07:33.576	2025-12-17 16:07:33.576
9727c62f-998d-4ddc-b97b-f1f7e6661228	Compresseur John Deer	EQ-0044	604	6348604	\N	\N	Active	5efdc26d-8337-4321-9a0d-2e05fdacbcbc	64d8e2f6-bd3c-46a3-86a1-46ad99a1adec		2025-12-17 16:07:35.61	2025-12-17 16:07:35.61
97ce880c-2245-452a-88c0-0302b3ebb66b	Scie perfora	EQ-0045	606	6348606	\N	\N	Active	8d9f6ff7-1eac-4dc0-9100-d4b9f1b16399	64d8e2f6-bd3c-46a3-86a1-46ad99a1adec		2025-12-17 16:07:37.68	2025-12-17 16:07:37.68
267ac168-a547-4750-b73e-4e3a42fae2d1	Drilleuse "Down the hole"	EQ-0046	607	6348607	\N	\N	Active	a515e973-39c5-4a21-9acd-6451290b3860	64d8e2f6-bd3c-46a3-86a1-46ad99a1adec		2025-12-17 16:07:39.705	2025-12-17 16:07:39.705
4a3184cb-aea5-4a03-bc6c-2799eb90146a	Drill Hydraulique explorer	EQ-0047	611	6348611	\N	\N	Active	a515e973-39c5-4a21-9acd-6451290b3860	64d8e2f6-bd3c-46a3-86a1-46ad99a1adec		2025-12-17 16:07:41.731	2025-12-17 16:07:41.731
83f65961-4131-4637-843f-f6a8cb182bb5	Compresseur orange	EQ-0048	612	6348612	\N	\N	Active	5efdc26d-8337-4321-9a0d-2e05fdacbcbc	64d8e2f6-bd3c-46a3-86a1-46ad99a1adec		2025-12-17 16:07:43.818	2025-12-17 16:07:43.818
3ac33eb1-bf2b-4c99-af89-013d9bf06cdc	G├®n├®ratrice 45-49 KVA (Multiquip)	EQ-0049	613	6348613	\N	\N	Active	f1bb23dd-9e0f-4755-b564-696463aa58a6	64d8e2f6-bd3c-46a3-86a1-46ad99a1adec		2025-12-17 16:07:45.961	2025-12-17 16:07:45.961
6d5dc8f8-054a-4d37-a9b4-7993cf50a110	Dresser 570 Komatsu (payloader)	EQ-0050	616	6348616	\N	\N	Active	df737e7f-62b0-42fa-9676-33fd5e7519c1	64d8e2f6-bd3c-46a3-86a1-46ad99a1adec		2025-12-17 16:07:47.998	2025-12-17 16:07:47.998
bdc268a3-3042-47cf-a895-aa8163216786	Toyo1 (Marteau) 1998	EQ-0051	621	6348621	\N	\N	Active	df737e7f-62b0-42fa-9676-33fd5e7519c1	64d8e2f6-bd3c-46a3-86a1-46ad99a1adec		2025-12-17 16:07:49.999	2025-12-17 16:07:49.999
566b3dce-1cec-4c22-92f4-51792ea72c64	Compresseur portatif diesel 185 CFM	EQ-0052	622	6348622	\N	\N	Active	5efdc26d-8337-4321-9a0d-2e05fdacbcbc	64d8e2f6-bd3c-46a3-86a1-46ad99a1adec		2025-12-17 16:07:52.002	2025-12-17 16:07:52.002
4cb45354-688b-4017-a7d5-ca57becdc9c8	Loader caterpillar 988-B 1979	EQ-0053	623	6348623	\N	\N	Active	df737e7f-62b0-42fa-9676-33fd5e7519c1	64d8e2f6-bd3c-46a3-86a1-46ad99a1adec		2025-12-17 16:07:54.042	2025-12-17 16:07:54.042
fa55766b-c1f9-42bf-9769-d64df5eb5915	Loader caterpillar 988-B 1987	EQ-0054	624	6348624	\N	\N	Active	df737e7f-62b0-42fa-9676-33fd5e7519c1	64d8e2f6-bd3c-46a3-86a1-46ad99a1adec		2025-12-17 16:07:56.096	2025-12-17 16:07:56.096
617c7148-d177-4ae8-ba8e-3f5ca9649f1a	Petite scie pour ├®quarrir	EQ-0055	626	6348626	\N	\N	Active	3255058f-7c58-4c0f-a0ac-779954e1d3da	64d8e2f6-bd3c-46a3-86a1-46ad99a1adec		2025-12-17 16:07:58.11	2025-12-17 16:07:58.11
94ecb7f2-9602-4fe2-b957-211260574762	Pelle Komatsu	EQ-0056	628	6348628	\N	\N	Active	fb8d7494-1eef-4265-9de8-06bd2edf5237	64d8e2f6-bd3c-46a3-86a1-46ad99a1adec		2025-12-17 16:08:00.137	2025-12-17 16:08:00.137
6d36952f-a5d4-4e9c-b33b-11c79ef1c87a	down the hole drill (pneumatic & hydraulic)	EQ-0080	627	6348628	\N	\N	Active	a515e973-39c5-4a21-9acd-6451290b3860	64d8e2f6-bd3c-46a3-86a1-46ad99a1adec		2025-12-17 16:08:02.354	2025-12-17 16:08:02.354
82325e79-4b7e-4b1d-bc94-02ab0d7d4b96	Soudeuse Hobert 460	EQ-0038	501	4800360	\N	\N	Active	86009bd2-8024-4910-90cd-1dc2498e58e2	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:08:04.417	2025-12-17 16:08:04.417
01793d12-7e96-4825-8779-085e20cc063c	Soudeuse Lincoln 400	EQ-0039	502	4800360	\N	\N	Active	86009bd2-8024-4910-90cd-1dc2498e58e2	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:08:06.514	2025-12-17 16:08:06.514
c6244392-27d7-49c9-951b-ea492610a4e4	Soudeuse Hobert LN25	EQ-0040	503	4800360	\N	\N	Active	86009bd2-8024-4910-90cd-1dc2498e58e2	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:08:08.544	2025-12-17 16:08:08.544
70ab4522-b717-41a4-9fc4-274e61cf2be5	john Deer 544	EQ-0027	400	4800400	\N	\N	Active	df737e7f-62b0-42fa-9676-33fd5e7519c1	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:08:10.551	2025-12-17 16:08:10.551
3e522c93-d452-4a8a-be66-802e8d18d158	Inter SS 6 Roues 1987	EQ-0028	401	4800401	\N	\N	Active	df737e7f-62b0-42fa-9676-33fd5e7519c1	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:08:12.6	2025-12-17 16:08:12.6
3de84a07-0a77-4a71-9676-807ea905c91f	Caterpilar 988 Stanstead	EQ-0029	402	6348402	\N	\N	Active	df737e7f-62b0-42fa-9676-33fd5e7519c1	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:08:14.648	2025-12-17 16:08:14.648
150140e1-565a-450f-a397-1cafe8b9e78c	T-Rex TL160 (blanc)	EQ-0030	403	4800403	\N	\N	Active	df737e7f-62b0-42fa-9676-33fd5e7519c1	23fa7ff4-f639-4427-89f9-c6cf68589c23		2025-12-17 16:08:16.797	2025-12-17 16:08:16.797
2e176500-3078-4f96-8dff-c9f36c89f0b3	T-Rex TL260 (blanc2011)	EQ-0031	404	4800404	\N	\N	Active	df737e7f-62b0-42fa-9676-33fd5e7519c1	23fa7ff4-f639-4427-89f9-c6cf68589c23		2025-12-17 16:08:18.8	2025-12-17 16:08:18.8
8ef9afc3-34ec-44ac-bf33-587af6dfb16d	Ford F-150 (Daniel 2012)	EQ-0032	405	4800405	\N	\N	Active	90eff868-92c6-4d88-82bb-ab8a7c2cd30e	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:08:20.808	2025-12-17 16:08:20.808
0617bfcb-960b-41de-a6d2-06b5aaf93e31	ford F-150 Gris Carl (2010)	EQ-0033	406	4800406	\N	\N	Active	90eff868-92c6-4d88-82bb-ab8a7c2cd30e	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:08:22.822	2025-12-17 16:08:22.822
9d08bcc5-f0d6-40cd-8cef-c7e976b8e682	Ford F-150 DB Carr. (2012)	EQ-0034	407	6348407	\N	\N	Active	90eff868-92c6-4d88-82bb-ab8a7c2cd30e	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:08:24.838	2025-12-17 16:08:24.838
51144496-9b76-4c2b-8246-a6477815bd14	Volvo 330	EQ-0035	408	4800408	\N	\N	Active	df737e7f-62b0-42fa-9676-33fd5e7519c1	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:08:26.838	2025-12-17 16:08:26.838
60dacfcc-f044-4209-bd53-dc4a767a4397	GANTS 11168663	EQ-0081		4220600	\N	\N	Active	98b38441-0d36-4651-a912-2bdf713aa2ec	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:08:28.871	2025-12-17 16:08:28.871
cf295308-fac7-425e-a11e-ce912947a61d	VESTE NOIR COTON IGNIFUGE LINDE	EQ-0082		4220600	\N	\N	Active	98b38441-0d36-4651-a912-2bdf713aa2ec	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:08:30.907	2025-12-17 16:08:30.907
d0bfab87-064a-46c1-a4c8-85c52c4d55e8	HABIT PLUIE EN POCHE 3PCS JAUNE	EQ-0083		4220600	\N	\N	Active	98b38441-0d36-4651-a912-2bdf713aa2ec	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:08:33.084	2025-12-17 16:08:33.084
3529ce21-a0d7-437d-bb89-38f7092e6fba	GANT NITRILE SUR NYLON BLEU GR 9	EQ-0084		4220600	\N	\N	Active	98b38441-0d36-4651-a912-2bdf713aa2ec	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:08:35.095	2025-12-17 16:08:35.095
0fc1b71d-265e-4925-8075-41f648f8c31a	LUNETTES SECURITE CLAIRE FUMEE GS1000C	EQ-0085		4220600	\N	\N	Active	98b38441-0d36-4651-a912-2bdf713aa2ec	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:08:37.144	2025-12-17 16:08:37.144
b938f26c-7d31-40cb-9d47-e5f971e7de09	LUNETTES SECURITE CLAIRE FUMEE GS1000C	EQ-0086		4220600	\N	\N	Active	98b38441-0d36-4651-a912-2bdf713aa2ec	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:08:39.189	2025-12-17 16:08:39.189
dfedc041-0546-421c-8760-2d1294d7754c	LUNETTES SECURITE FUMEE GS1000S	EQ-0087		4220600	\N	\N	Active	98b38441-0d36-4651-a912-2bdf713aa2ec	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:08:41.257	2025-12-17 16:08:41.257
3a343330-72f8-4667-b6ca-d1eaf7af7168	LUNETTE SECURITE11169114 / #S3435X	EQ-0088		4220600	\N	\N	Active	98b38441-0d36-4651-a912-2bdf713aa2ec	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:08:43.266	2025-12-17 16:08:43.266
68aad8b7-82b5-4334-9771-361777e850dd	GANTS SOUDEURS SABLE FIL KEVLAR	EQ-0090		4220600	\N	\N	Active	98b38441-0d36-4651-a912-2bdf713aa2ec	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:08:45.285	2025-12-17 16:08:45.285
bb97c08b-f486-4252-8b40-817e8e413cfd	GANT CUIR FENDU ET COTON MANC. TG	EQ-0091		4220600	\N	\N	Active	98b38441-0d36-4651-a912-2bdf713aa2ec	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:08:47.431	2025-12-17 16:08:47.431
3d9a2ea5-8d3e-4a30-9b95-35546f5de646	VESTE CIRCUL ORANGE POLYESTER CSA	EQ-0093		4220600	\N	\N	Active	98b38441-0d36-4651-a912-2bdf713aa2ec	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:08:49.447	2025-12-17 16:08:49.447
90120f26-0e4e-48df-9f89-76b05da3e16c	VESTE CIRCUL ORANGE POLYESTER CSA	EQ-0094		4220600	\N	\N	Active	98b38441-0d36-4651-a912-2bdf713aa2ec	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:08:51.482	2025-12-17 16:08:51.482
aa2d64c9-0530-4a81-83e4-f15a7c53b75d	OXYGENE VRAC	EQ-0095		4220500	\N	\N	Active	98b38441-0d36-4651-a912-2bdf713aa2ec	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:08:53.489	2025-12-17 16:08:53.489
441fe35b-ff00-4edf-bf2a-03c45a61a24f	Scie Wilson 3|0 m	EQ-0003	102	48000102	\N	\N	Active	a53c1e16-ecf2-442e-a4a3-271e73a828fd	e92fc969-1122-49ab-b32d-7619f48973c9	Wilson Industrial	2025-12-17 16:08:55.502	2025-12-17 16:08:55.502
04fb0813-f801-472b-8a06-0823cd53d75c	Barri├¿re de s├®curit├® 3.5	EQ-0004	116	4800101	\N	\N	Active	d914aef8-b04e-48da-849a-76cac95cb004	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:08:57.524	2025-12-17 16:08:57.524
d294a69a-a2e4-4737-b42a-ccf59dc02832	Barri├¿re de s├®curit├® 3.0	EQ-0005	117	4800102	\N	\N	Active	d914aef8-b04e-48da-849a-76cac95cb004	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:08:59.581	2025-12-17 16:08:59.581
0320e90e-bff4-4089-b9a9-bfae61160c8e	Pompe ├á eau usine 1	EQ-0006	106	4800106	\N	\N	Active	cb62b1cd-b252-4f20-af3c-1837d9a98589	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:09:01.594	2025-12-17 16:09:01.594
91f097b7-ce05-4ea4-9297-6e3b35297b58	Porte avant 3.5 m avant	EQ-0007	109	4800700	\N	\N	Active	b10d34c5-ca80-454c-99a5-b287937c06f9	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:09:03.737	2025-12-17 16:09:03.737
fa9fa49b-0bc5-4da1-8b02-862abc7c130d	Porte avant 3.5 m arri├¿re	EQ-0008	110	4800700	\N	\N	Active	b10d34c5-ca80-454c-99a5-b287937c06f9	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:09:05.762	2025-12-17 16:09:05.762
1fdc1b14-a318-49f7-afb6-7b4b015d7797	Porte avant 3.0 m avant	EQ-0009	111	4800700	\N	\N	Active	b10d34c5-ca80-454c-99a5-b287937c06f9	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:09:07.819	2025-12-17 16:09:07.819
8f3eab21-2f39-40ca-bf70-f0609c9c69a0	Porte avant 3.0 m arriere	EQ-0010	112	4800700	\N	\N	Active	b10d34c5-ca80-454c-99a5-b287937c06f9	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:09:09.831	2025-12-17 16:09:09.831
a25c5f1b-0a38-4acc-9c29-092738e2d2c7	Scie Wilson 3.5 m	EQ-0099	101	48000101	\N	\N	Active	a53c1e16-ecf2-442e-a4a3-271e73a828fd	e92fc969-1122-49ab-b32d-7619f48973c9	WILSON INDUSTRIAL	2025-12-17 16:09:11.875	2025-12-17 16:09:11.875
b6494ffc-ba3f-492f-9b12-e6b9b8e0f27c	Polisseur Wilson U2	EQ-0011	201	4800201	\N	\N	Active	376b1e95-eda2-4db8-a7e8-eebbb441d518	e92fc969-1122-49ab-b32d-7619f48973c9	Wilson Industrial	2025-12-17 16:09:13.916	2025-12-17 16:09:13.916
574c4694-06a2-4146-8537-a4f40f2d52a6	Pont Roulant 3T U2	EQ-0012	202	4800202	\N	\N	Active	f3f1624c-8f79-4843-b4dd-75fe03b4506e	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:09:15.926	2025-12-17 16:09:15.926
72d22003-7c58-4861-ba42-067022227dc0	Syst├¿me de chauffage U2	EQ-0013	203	4800700	\N	\N	Active	0cebc34b-f223-468a-94fa-7ad43085bfb5	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:09:17.941	2025-12-17 16:09:17.941
3be80a5e-6213-438b-81d6-24723232ad81	Scandivent C4	EQ-0014	209	4800209	\N	\N	Active	b5edd9df-6a1f-4bde-975a-9f9992352329	e92fc969-1122-49ab-b32d-7619f48973c9	Scandinvent	2025-12-17 16:09:20.085	2025-12-17 16:09:20.085
995a4c4a-962f-4da8-ab4c-d70349c63fd0	Pompe ├á eau U2 recycl├®e	EQ-0015	214	4800106	\N	\N	Active	cb62b1cd-b252-4f20-af3c-1837d9a98589	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:09:22.121	2025-12-17 16:09:22.121
e7754ae6-c7db-4a35-8ac3-f22d6e996a8d	Pompe ├á eau U2 propre	EQ-0016	215	4800106	\N	\N	Active	cb62b1cd-b252-4f20-af3c-1837d9a98589	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:09:24.147	2025-12-17 16:09:24.147
38ed85c9-7eca-472d-bbf0-0436320d08b9	S5 Bimatech Techtone 4000	EQ-0017	233	4800233	\N	\N	Active	b5edd9df-6a1f-4bde-975a-9f9992352329	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:09:26.147	2025-12-17 16:09:26.147
f3e4228c-a39e-4d00-8833-01841ec33659	Sfera 825 CNC NOAT	EQ-0018	235	4800235	\N	\N	Active	ef076d2e-f16c-4e79-8e5b-27204d5cf09d	e92fc969-1122-49ab-b32d-7619f48973c9	Noat Srl	2025-12-17 16:09:28.167	2025-12-17 16:09:28.167
8c5cb27c-1d4e-4a40-871e-eea6c7a33a77	Porte avant U2	EQ-0019	226	4800700	\N	\N	Active	b10d34c5-ca80-454c-99a5-b287937c06f9	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:09:30.169	2025-12-17 16:09:30.169
2e1a3eee-cd47-48e2-b201-bac7bf5544e0	Porte arri├¿re U2	EQ-0020	227	4800700	\N	\N	Active	b10d34c5-ca80-454c-99a5-b287937c06f9	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:09:32.199	2025-12-17 16:09:32.199
40f227ca-b578-4058-8543-4b9130bcf912	Ligne ├á air U2	EQ-0021	221	4800221	\N	\N	Active	96e4eebf-0424-4d77-9b43-6534bab01e96	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:09:34.371	2025-12-17 16:09:34.371
617a5c56-0069-4fad-bf0a-46144b0b862a	Ligne ├á eau propre U2	EQ-0022	223	4800106	\N	\N	Active	6be314a8-20d8-418a-ac50-40149fa7d324	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:09:36.418	2025-12-17 16:09:36.418
5b34c0df-9ad7-4362-91ba-8764fc157275	Ligne ├á eau recycl├®e U2	EQ-0023	222	4800106	\N	\N	Active	6be314a8-20d8-418a-ac50-40149fa7d324	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:09:38.428	2025-12-17 16:09:38.428
6d881973-ce0a-437a-bc89-dff2ac29dec7	Grinder petit U2	EQ-0024	220	4800349	\N	\N	Active	3255058f-7c58-4c0f-a0ac-779954e1d3da	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:09:40.453	2025-12-17 16:09:40.453
ed3d3f14-3977-410e-8890-b015ac818e47	Grinder Hydraulique U2	EQ-0025	219	4800349	\N	\N	Active	3255058f-7c58-4c0f-a0ac-779954e1d3da	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:09:42.473	2025-12-17 16:09:42.473
4a3eef36-70b9-4081-81f8-c77920247e0a	Barri├¿re de s├®curit├® Sfera	EQ-0026	230	4800201	\N	\N	Active	d914aef8-b04e-48da-849a-76cac95cb004	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:09:44.476	2025-12-17 16:09:44.476
a7e93dac-6c5d-496d-b0a3-c51953f58bb3	Compresseur ├á air Leroy	EQ-0041	301	4800360	\N	\N	Active	5efdc26d-8337-4321-9a0d-2e05fdacbcbc	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:09:46.48	2025-12-17 16:09:46.48
8ad51a8c-4cd8-4c8f-a299-8692bb34a419	Terzago	EQ-0057	305	4800305	\N	\N	Active	a53c1e16-ecf2-442e-a4a3-271e73a828fd	e92fc969-1122-49ab-b32d-7619f48973c9	MARC PR├ëVOST MACHINERIE INC.	2025-12-17 16:09:48.481	2025-12-17 16:09:48.481
42b163c9-1c42-437f-890f-0eb1e8e7490f	Falcon	EQ-0058	306	4080306	\N	\N	Active	fc0b4674-cebb-4a15-871e-2dc7f3045d4b	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:09:50.622	2025-12-17 16:09:50.622
98021cc5-6471-45b7-957a-afc8ee9ca7b8	Scie park industries Gantry Predator II	EQ-0059	308	4800308	\N	\N	Active	a53c1e16-ecf2-442e-a4a3-271e73a828fd	e92fc969-1122-49ab-b32d-7619f48973c9	PARK INDUSTRIES	2025-12-17 16:09:52.625	2025-12-17 16:09:52.625
0e38e5bb-374b-4b75-8509-9f52ad8c7463	Barri├¿res s├®curit├® Falcon	EQ-0060	311	4800306	\N	\N	Active	d914aef8-b04e-48da-849a-76cac95cb004	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:09:54.626	2025-12-17 16:09:54.626
b4e52449-33d6-4ffb-9860-ee4bda5c1f4c	Barri├¿res s├®curit├® predator	EQ-0061	312	4800308	\N	\N	Active	d914aef8-b04e-48da-849a-76cac95cb004	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:09:56.638	2025-12-17 16:09:56.638
e4ba5cc7-b708-4fac-8282-5627820d3ad8	Convoyeur Entr├®e splitter	EQ-0062	318	4800320	\N	\N	Active	467faa0d-87a2-48ea-8bb0-3441f19fac49	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:09:58.638	2025-12-17 16:09:58.638
c8ccc3a9-1aa7-45d0-bd9d-ff15817979a9	Guillotine	EQ-0063	320	4800320	\N	\N	Active	4fe564e3-2664-4bc0-a137-b3bc811dc339	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:10:00.648	2025-12-17 16:10:00.648
b057b976-d47d-42ed-b034-0f79b814793e	Convoyeur guillotine	EQ-0064	321	4800320	\N	\N	Active	467faa0d-87a2-48ea-8bb0-3441f19fac49	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:10:02.649	2025-12-17 16:10:02.649
2c022086-29bd-437e-ab59-40ef62a7fb0b	Pont roulant 10 tonnes U3	EQ-0065	329	4800329	\N	\N	Active	f3f1624c-8f79-4843-b4dd-75fe03b4506e	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:10:04.649	2025-12-17 16:10:04.649
8003afa9-f51e-4c69-bddc-17113c63db6d	Pont roulant 25 tonnes U3	EQ-0066	330	4800330	\N	\N	Active	f3f1624c-8f79-4843-b4dd-75fe03b4506e	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:10:06.81	2025-12-17 16:10:06.81
04cc3016-dc3c-4990-8600-a5e576e15451	Syst├¿me de chauffage U3	EQ-0067	331	4800700	\N	\N	Active	0cebc34b-f223-468a-94fa-7ad43085bfb5	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:10:08.821	2025-12-17 16:10:08.821
65798486-f77d-44fc-a563-d4e94431e561	Porte avant #1 U3	EQ-0068	333	4800700	\N	\N	Active	b10d34c5-ca80-454c-99a5-b287937c06f9	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:10:10.844	2025-12-17 16:10:10.844
0b5a4a67-ab24-45a9-bb93-16d5724f0251	Porte avant #2 U3	EQ-0069	334	4800700	\N	\N	Active	b10d34c5-ca80-454c-99a5-b287937c06f9	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:10:12.867	2025-12-17 16:10:12.867
7a19bc83-7f37-42be-bee8-157f6bd1d422	porte avant #3 U3	EQ-0070	335	4800700	\N	\N	Active	b10d34c5-ca80-454c-99a5-b287937c06f9	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:10:14.866	2025-12-17 16:10:14.866
5338d154-c64e-438f-8530-f3e22595f58b	Porte arri├¿re #1 U3	EQ-0071	337	4800700	\N	\N	Active	b10d34c5-ca80-454c-99a5-b287937c06f9	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:10:16.866	2025-12-17 16:10:16.866
f54fbbfe-2f60-42ff-ae93-cb87747dc809	Porte arri├¿re #2 U3	EQ-0072	338	4800700	\N	\N	Active	b10d34c5-ca80-454c-99a5-b287937c06f9	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:10:18.886	2025-12-17 16:10:18.886
c9e8cd60-fba5-45f2-bf1c-99c31212a49f	porte arri├¿re #3 U3	EQ-0073	339	4800700	\N	\N	Active	b10d34c5-ca80-454c-99a5-b287937c06f9	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:10:21.031	2025-12-17 16:10:21.031
7ddb2e5c-53d3-48f9-983b-0bbb1115440d	porte arri├¿re #4 U3	EQ-0074	340	4800700	\N	\N	Active	b10d34c5-ca80-454c-99a5-b287937c06f9	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:10:23.072	2025-12-17 16:10:23.072
515259ae-acb4-4bea-a9bd-4a782cb18c0f	Ligne d'eau recycl├®e U3	EQ-0075	342	4800106	\N	\N	Active	6be314a8-20d8-418a-ac50-40149fa7d324	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:10:25.09	2025-12-17 16:10:25.09
0a082c71-ff37-4755-822c-6d114a8e6995	Ligne d'eau propre U3	EQ-0076	343	4800106	\N	\N	Active	6be314a8-20d8-418a-ac50-40149fa7d324	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:10:27.114	2025-12-17 16:10:27.114
4bc6ce68-a552-42f9-85a1-25ec430a7f83	Ligne ├á air U3	EQ-0077	344	4800221	\N	\N	Active	96e4eebf-0424-4d77-9b43-6534bab01e96	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:10:29.131	2025-12-17 16:10:29.131
2a03e467-bbdd-4b42-8d77-6031b0192aa1	Compresseur ├á l'air mobile ingersoll rand 185 diesel (petit portatif)	EQ-0078	345	4800345	\N	\N	Active	5efdc26d-8337-4321-9a0d-2e05fdacbcbc	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:10:31.13	2025-12-17 16:10:31.13
d5e282a0-443e-49f5-bdcd-acfcfa9f0c38	Sullair compresseur ├®lectrique U3	EQ-0079	346	4800346	\N	\N	Active	5efdc26d-8337-4321-9a0d-2e05fdacbcbc	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:10:33.131	2025-12-17 16:10:33.131
7c0cf06a-16fd-4ba2-9184-be766144c23c	Table tournante Terzago	EQ-0105	305	4800305	\N	\N	Active	a53c1e16-ecf2-442e-a4a3-271e73a828fd	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:10:35.132	2025-12-17 16:10:35.132
63e143c7-3932-43a7-a00f-9b7cc705c7a1	Water jet 150 HP 575 electric uNIT 15000 psi 12 GPM #9 PLUNGERS (U4)	EQ-0036	450	4800450	\N	\N	Active	df737e7f-62b0-42fa-9676-33fd5e7519c1	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:10:37.261	2025-12-17 16:10:37.261
bee833db-9b7d-400f-9661-5d020365c335	Xinda SHXJ2200 (U4)	EQ-0037	451	4800451	\N	\N	Active	fc0b4674-cebb-4a15-871e-2dc7f3045d4b	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:10:39.31	2025-12-17 16:10:39.31
cb78e5a6-c697-4d9a-8dce-6111fccabe1d	Camion Grue Freightline	EQ-0096			\N	\N	Active	afcd2e03-eca1-4336-b932-904205602a49	e92fc969-1122-49ab-b32d-7619f48973c9		2025-12-17 16:10:41.338	2025-12-17 16:10:41.338
9aa8de82-a818-4306-8e51-3a9b97fc9fc7	SCIE BLEUE	EQ-0108			\N	\N	Active	a53c1e16-ecf2-442e-a4a3-271e73a828fd	23fa7ff4-f639-4427-89f9-c6cf68589c23		2025-12-17 16:10:43.36	2025-12-17 16:10:43.36
49f3823a-fb2d-47bb-ba51-964c501ee2ef	GUILLOTINEUSE	EQ-0114			\N	\N	Active	4fe564e3-2664-4bc0-a137-b3bc811dc339	23fa7ff4-f639-4427-89f9-c6cf68589c23		2025-12-17 16:10:45.556	2025-12-17 16:10:45.556
22659a36-9110-4057-a847-fe1270abe8fd	SCIE WILSON	EQ-0116			\N	\N	Active	a53c1e16-ecf2-442e-a4a3-271e73a828fd	23fa7ff4-f639-4427-89f9-c6cf68589c23		2025-12-17 16:10:47.619	2025-12-17 16:10:47.619
7f31f18e-079f-4bf9-a3c0-b4c403ddb19d	CONVOYEURS A ROULEAUX	EQ-0117			\N	\N	Active	7123a55c-a34e-42d1-b2f4-9c8f7e1e1e96	23fa7ff4-f639-4427-89f9-c6cf68589c23		2025-12-17 16:10:49.643	2025-12-17 16:10:49.643
af961241-8c2f-414a-99c6-daaa3b04d765	HYSTER 50	EQ-0119			\N	\N	Active	df737e7f-62b0-42fa-9676-33fd5e7519c1	23fa7ff4-f639-4427-89f9-c6cf68589c23		2025-12-17 16:10:51.803	2025-12-17 16:10:51.803
26b23187-993c-42e8-bd08-eb2a7eec4061	SCIE A CABLE - N5	EQ-0109			\N	\N	Active	fc0b4674-cebb-4a15-871e-2dc7f3045d4b	23fa7ff4-f639-4427-89f9-c6cf68589c23		2025-12-17 16:10:53.824	2025-12-17 16:10:53.824
a9aae6d3-0e0f-4636-ba31-1b5ae4759430	SCIE 3METRES - N3	EQ-0110			\N	\N	Active	a53c1e16-ecf2-442e-a4a3-271e73a828fd	23fa7ff4-f639-4427-89f9-c6cf68589c23		2025-12-17 16:10:55.82	2025-12-17 16:10:55.82
8d28c376-18fe-4ddc-b343-1aa091409e15	SCIE 3METRES - N4	EQ-0111			\N	\N	Active	a53c1e16-ecf2-442e-a4a3-271e73a828fd	23fa7ff4-f639-4427-89f9-c6cf68589c23		2025-12-17 16:10:57.822	2025-12-17 16:10:57.822
f5d8c107-92b9-46db-838a-b16b221a5932	SCIE 2|5METRES - N1	EQ-0112			\N	\N	Active	a53c1e16-ecf2-442e-a4a3-271e73a828fd	23fa7ff4-f639-4427-89f9-c6cf68589c23		2025-12-17 16:10:59.83	2025-12-17 16:10:59.83
851295d9-aaa5-4f88-a99f-ec271cc6e754	SCIE 3|5METRES - N2	EQ-0113			\N	\N	Active	a53c1e16-ecf2-442e-a4a3-271e73a828fd	23fa7ff4-f639-4427-89f9-c6cf68589c23		2025-12-17 16:11:01.857	2025-12-17 16:11:01.857
ff8982b8-8a86-4efc-925b-14d4265af01b	SFERA 825	EQ-0115			\N	\N	Active	ef076d2e-f16c-4e79-8e5b-27204d5cf09d	23fa7ff4-f639-4427-89f9-c6cf68589c23		2025-12-17 16:11:03.848	2025-12-17 16:11:03.848
750d1ce9-55c9-4b3b-a818-3810b910dcfb	TEREX TL 260	EQ-0118			\N	\N	Active	df737e7f-62b0-42fa-9676-33fd5e7519c1	23fa7ff4-f639-4427-89f9-c6cf68589c23		2025-12-17 16:11:05.857	2025-12-17 16:11:05.857
\.


--
-- Data for Name: EquipmentCategory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."EquipmentCategory" (id, name, "createdAt", "updatedAt") FROM stdin;
90eff868-92c6-4d88-82bb-ab8a7c2cd30e	Automobile	2025-12-17 16:06:59.28	2025-12-17 16:06:59.28
d914aef8-b04e-48da-849a-76cac95cb004	Barri├¿re de s├®curit├®e	2025-12-17 16:07:00.323	2025-12-17 16:07:00.323
afcd2e03-eca1-4336-b932-904205602a49	Boom Truck	2025-12-17 16:07:00.965	2025-12-17 16:07:00.965
df737e7f-62b0-42fa-9676-33fd5e7519c1	Chargeur	2025-12-17 16:07:01.682	2025-12-17 16:07:01.682
0cebc34b-f223-468a-94fa-7ad43085bfb5	Chauffage	2025-12-17 16:07:02.323	2025-12-17 16:07:02.323
b5edd9df-6a1f-4bde-975a-9f9992352329	CNC Profileuse	2025-12-17 16:07:02.973	2025-12-17 16:07:02.973
5efdc26d-8337-4321-9a0d-2e05fdacbcbc	Compresseur	2025-12-17 16:07:03.617	2025-12-17 16:07:03.617
98b38441-0d36-4651-a912-2bdf713aa2ec	Consommables	2025-12-17 16:07:04.256	2025-12-17 16:07:04.256
467faa0d-87a2-48ea-8bb0-3441f19fac49	Convoyeur	2025-12-17 16:07:04.907	2025-12-17 16:07:04.907
a515e973-39c5-4a21-9acd-6451290b3860	Drilleuse	2025-12-17 16:07:05.549	2025-12-17 16:07:05.549
f1bb23dd-9e0f-4755-b564-696463aa58a6	G├®n├®ratrice	2025-12-17 16:07:06.189	2025-12-17 16:07:06.189
b10d34c5-ca80-454c-99a5-b287937c06f9	Grande porte	2025-12-17 16:07:06.849	2025-12-17 16:07:06.849
4fe564e3-2664-4bc0-a137-b3bc811dc339	Guillotineuse	2025-12-17 16:07:07.509	2025-12-17 16:07:07.509
96e4eebf-0424-4d77-9b43-6534bab01e96	Ligne ├á air	2025-12-17 16:07:08.155	2025-12-17 16:07:08.155
6be314a8-20d8-418a-ac50-40149fa7d324	Ligne ├á eau	2025-12-17 16:07:08.797	2025-12-17 16:07:08.797
7123a55c-a34e-42d1-b2f4-9c8f7e1e1e96	N.D.	2025-12-17 16:07:09.447	2025-12-17 16:07:09.447
3255058f-7c58-4c0f-a0ac-779954e1d3da	Outillage de coupe	2025-12-17 16:07:10.087	2025-12-17 16:07:10.087
fb8d7494-1eef-4265-9de8-06bd2edf5237	Pelle	2025-12-17 16:07:10.754	2025-12-17 16:07:10.754
376b1e95-eda2-4db8-a7e8-eebbb441d518	Polisseur	2025-12-17 16:07:11.396	2025-12-17 16:07:11.396
cb62b1cd-b252-4f20-af3c-1837d9a98589	Pompe ├á eau	2025-12-17 16:07:12.051	2025-12-17 16:07:12.051
f3f1624c-8f79-4843-b4dd-75fe03b4506e	Pont Roulant	2025-12-17 16:07:12.693	2025-12-17 16:07:12.693
8d9f6ff7-1eac-4dc0-9100-d4b9f1b16399	Scie ├á Cable Carri├¿re	2025-12-17 16:07:13.342	2025-12-17 16:07:13.342
fc0b4674-cebb-4a15-871e-2dc7f3045d4b	Scie ├á Cable Usine	2025-12-17 16:07:13.987	2025-12-17 16:07:13.987
a53c1e16-ecf2-442e-a4a3-271e73a828fd	Scie circulaire	2025-12-17 16:07:14.624	2025-12-17 16:07:14.624
ef076d2e-f16c-4e79-8e5b-27204d5cf09d	Scie CNC	2025-12-17 16:07:15.392	2025-12-17 16:07:15.392
86009bd2-8024-4910-90cd-1dc2498e58e2	Soudeuse	2025-12-17 16:07:16.037	2025-12-17 16:07:16.037
\.


--
-- Data for Name: Incoterm; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Incoterm" (id, name, "xmlCode", "requiresText", "createdAt", "updatedAt") FROM stdin;
96e8bd0e-67dd-412b-81b7-49f7e8cef1e0	FOB	FOB	f	2025-12-17 16:02:49.686	2025-12-17 16:02:49.686
df457872-7df9-494f-9f3b-308e4791f5b1	Saisie Libre	Saisie Libre	f	2025-12-17 16:02:49.941	2025-12-17 16:02:49.941
46ccef01-0f67-49d4-b730-66cb1849f312	Ex Works	Ex Works	f	2025-12-17 16:02:50.074	2025-12-17 16:02:50.074
\.


--
-- Data for Name: Language; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Language" (id, code, name, "createdAt", "updatedAt") FROM stdin;
224bd847-7c68-4b52-8e4b-62a36e6ec297	fr	Fran├ºais	2025-12-13 01:43:39.227	2025-12-13 01:43:39.227
265712e7-531c-42ff-8a09-cb8d6c29d361	en	English	2025-12-13 01:43:39.227	2025-12-13 01:43:39.227
\.


--
-- Data for Name: MaintenanceSite; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."MaintenanceSite" (id, name, "createdAt", "updatedAt") FROM stdin;
64d8e2f6-bd3c-46a3-86a1-46ad99a1adec	CARRI├êRE CAL├ëDONIA 3	2025-12-17 16:07:29.95	2025-12-17 16:07:29.95
e92fc969-1122-49ab-b32d-7619f48973c9	GRANITE DRC RAP	2025-12-17 16:08:03.738	2025-12-17 16:08:03.738
23fa7ff4-f639-4427-89f9-c6cf68589c23	GRANITE DRC STD	2025-12-17 16:08:16.124	2025-12-17 16:08:16.124
e970a6fd-2cd2-4a35-ba42-34df7b59dca0	Bureau	2025-12-17 16:11:09.46	2025-12-17 16:11:09.46
973ff35f-639c-4ac4-8443-36715e176207	Container	2025-12-17 16:11:34.56	2025-12-17 16:11:34.56
aecddeee-cc79-45e1-98e8-4688c9962293	a d├®truire	2025-12-17 16:11:46.474	2025-12-17 16:11:46.474
7d099478-d2cd-4729-8ef5-c59bb34bc519	Garage	2025-12-17 16:12:22.274	2025-12-17 16:12:22.274
2b43e6f3-b243-4f47-995a-adbe5e22271b	Usine3	2025-12-17 16:13:01.05	2025-12-17 16:13:01.05
c86fc66d-ff9f-4fb9-bd2b-1c15a1c80a99	Usine 4	2025-12-17 16:13:25.008	2025-12-17 16:13:25.008
\.


--
-- Data for Name: Material; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Material" (id, name, category, type, "purchasePrice", "sellingPrice", unit, density, "wasteFactor", "densityUnit", quality, "syncStatus", "validityDuration", "sellingUnit", "imageUrl", "supplierId", "createdAt", "updatedAt") FROM stdin;
62de7c00-812a-4c53-a6d0-5d13b688db4e	Granite Noir St-Henry	Stone	Granite	3500	3800	m2	168	40	lb/ft3	A	DRAFT	\N	m2		d62a2e24-ddd6-486f-9ba3-3ceab2750f29	2025-12-13 01:43:39.209	2025-12-13 02:31:07.44
e3958141-94f2-425a-ae45-50336506c740	Granite Noir St-Henry	Stone	Granite	3800	4100	m2	168	40	lb/ft3	S	DRAFT	\N	m2		d62a2e24-ddd6-486f-9ba3-3ceab2750f29	2025-12-13 02:31:07.437	2025-12-13 02:31:07.437
1cc4fa29-763f-4aa1-b594-2b1e831527db	Granite Noir St-Henry	Stone	Granite	3200	3500	m2	168	40	lb/ft3	B	DRAFT	\N	m2		d62a2e24-ddd6-486f-9ba3-3ceab2750f29	2025-12-13 02:31:07.438	2025-12-13 02:31:07.438
b6bc1cf4-f3ce-486c-a127-e6be4ec65a19	Granite Noir St-Henry	Stone	Granite	2800	3100	m2	168	40	lb/ft3	C	DRAFT	\N	m2		d62a2e24-ddd6-486f-9ba3-3ceab2750f29	2025-12-13 02:31:07.439	2025-12-13 02:31:07.439
5e4c6c20-3a29-4011-805f-1e7ced2d0455	Caledonia	Stone	Granite	1700	2100	m2	175	40	lb/ft3	S	DRAFT	\N	m2		d62a2e24-ddd6-486f-9ba3-3ceab2750f29	2025-12-13 02:32:09.14	2025-12-13 02:32:09.14
d10cf632-92eb-4d81-9135-14b56cfec49f	Caledonia	Stone	Granite	1200	1600	m2	175	40	lb/ft3	B	DRAFT	\N	m2		d62a2e24-ddd6-486f-9ba3-3ceab2750f29	2025-12-13 02:32:09.142	2025-12-13 02:32:09.142
36e1ea3a-6462-4960-90b6-b89b26a715b0	Caledonia	Stone	Granite	900	1300	m2	175	40	lb/ft3	C	DRAFT	\N	m2		d62a2e24-ddd6-486f-9ba3-3ceab2750f29	2025-12-13 02:32:09.143	2025-12-13 02:32:09.143
dfb1f2b6-9096-455b-943e-939a9ccee1ec	Caledonia	Stone	Granite	1500	1800	m2	175	40	lb/ft3	A	DRAFT	\N	m2		d62a2e24-ddd6-486f-9ba3-3ceab2750f29	2025-12-13 02:32:09.141	2025-12-13 02:32:09.141
e5169383-0541-4c52-b815-e2c6d2d17961	Quartz Blanc Pur	Stone	Quartz	35	65	sqft	150	1.15	lb/ft3	A	DRAFT	\N	sqft	\N	\N	2025-12-17 16:04:41.447	2025-12-17 16:04:41.447
dd752d66-da69-4eb4-b77a-779a0035d1a1	Marbre Carrara	Stone	Marble	40	80	sqft	165	1.3	lb/ft3	S	DRAFT	\N	sqft	\N	\N	2025-12-17 16:04:41.809	2025-12-17 16:04:41.809
da6ef35e-e8d2-45db-a6c4-10c8ec17a351	ROBOT_VERIFICATION_CHECK_2025-12-17T16:04:46.059Z	Debug	Granite	9999	\N	sqft	\N	4	lb/ft3	S	DRAFT	\N	sqft	\N	\N	2025-12-17 16:04:47.002	2025-12-17 16:04:47.002
\.


--
-- Data for Name: Part; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Part" (id, name, reference, description, note, supplier, "stockQuantity", "minQuantity", "reqQuantity", "orderedQuantity", "categoryId", "siteId", "createdAt", "updatedAt") FROM stdin;
eabda6cf-ae6c-4616-820a-448cca50ae2d	1500/3133	N.R.	Ball Bearings for Conveyor Rollers	\N	\N	20	30	0	0	81f0b475-9894-4557-851e-7b4c5910188f	\N	2025-12-17 16:11:08.648	2025-12-17 16:11:08.648
66d9f8ad-7a49-4bda-ac35-5c2a74c18d83	ABF-3/10	N.R.	Filtre a air	\N	\N	0	0	0	0	95e1c06c-ac13-4d05-82d5-429b38706fcd	e970a6fd-2cd2-4a35-ba42-34df7b59dca0	2025-12-17 16:11:10.508	2025-12-17 16:11:10.508
7c819fcd-7376-45f2-b78e-e8ae5ae21520	Arbre Terzago HB	C062112	Arbre sur lequel sont fix├® les engrenage pour le mouvement haut bas		MARC PR├ëVOST MACHINERIE INC.	1	0	0	0	21af9639-ec83-4d6f-8495-e8f1e958d4f1	\N	2025-12-17 16:11:11.319	2025-12-17 16:11:11.319
d220b9e4-8ecf-4527-bda4-a36fa5d28763	AutomationDirect compact limit switch	N.R.	AutomationDirect compact limit switch| 360 degree stainless steel spring| (1) N.O./(1) N.C. contact(s)| snap action| 35mm wide body| die-cast zinc| 5-pin M12 quick-disconnect| bottom exit.	AutomationDirect compact limit switch| 360 degree	\N	2	2	0	0	7ce9e29f-44e4-4955-aaba-91ca8aaaf9bf	e970a6fd-2cd2-4a35-ba42-34df7b59dca0	2025-12-17 16:11:12.941	2025-12-17 16:11:12.941
4a59eaa4-1185-46b6-bc86-5f7a4dbcf5e0	Axe X Polisseur (GD)	Assemblage	Assemblage des composants de l'axe gauche droite	\N	\N	0	0	0	0	d848b2c2-9caf-4fe5-a47a-7bb2677ce41d	\N	2025-12-17 16:11:13.943	2025-12-17 16:11:13.943
f380ec32-3fc5-47d1-a40b-71aaeb8a40da	Axe x Predator (GD)	Assemblage	Assemblage des composants de l'axe gauche droite	\N	\N	0	0	0	0	d848b2c2-9caf-4fe5-a47a-7bb2677ce41d	\N	2025-12-17 16:11:14.766	2025-12-17 16:11:14.766
570fbd2a-5846-48f2-9d1d-e96100bf51fc	Axe X Terzago (GD)	Assemblage	Assemblage des composants de l'axe gauche droite	\N	\N	0	0	0	0	d848b2c2-9caf-4fe5-a47a-7bb2677ce41d	\N	2025-12-17 16:11:15.596	2025-12-17 16:11:15.596
e09d98bd-bd5f-4532-8d6b-5007036b4265	Axe X Wilson 3 (GD)	Assemblage	Assemblage des composants de l'axe gauche droite	\N	\N	0	0	1	0	d848b2c2-9caf-4fe5-a47a-7bb2677ce41d	\N	2025-12-17 16:11:16.423	2025-12-17 16:11:16.423
ad4eb8c1-6456-4be8-b921-395aa9407891	Axe X Wilson 3.5 (GD)	Assemblage	Assemblage des composants de l'axe gauche droite	\N	\N	0	0	0	0	d848b2c2-9caf-4fe5-a47a-7bb2677ce41d	\N	2025-12-17 16:11:17.264	2025-12-17 16:11:17.264
1f39d32d-53e6-4955-a7c9-54a5c46e7c26	Axe Y Falcon (AA)	Assemblage	Axe avant arri├¿re de la Falcon	\N	\N	0	0	0	0	d848b2c2-9caf-4fe5-a47a-7bb2677ce41d	\N	2025-12-17 16:11:18.081	2025-12-17 16:11:18.081
4089ce9b-3fc0-4c18-8062-1089f34cc632	Axe Y Polisseur (AA)	Assemblage	Assemblage des composants de l'axe avant arri├¿re	\N	\N	0	0	0	0	d848b2c2-9caf-4fe5-a47a-7bb2677ce41d	\N	2025-12-17 16:11:18.979	2025-12-17 16:11:18.979
d1afe3c2-3c45-468f-bc93-467a4d3aa3aa	Axe Y Predator (AA)	Assemblage	Assemblage des composants de l'axe avant arri├¿re	\N	\N	0	0	0	0	d848b2c2-9caf-4fe5-a47a-7bb2677ce41d	\N	2025-12-17 16:11:19.8	2025-12-17 16:11:19.8
c8a8eb46-2556-4fe4-a2a7-a45a515dd4fa	Axe Y Terzago (AA)	Assemblage	Assemblage des composants de l'axe avant arri├¿re	\N	\N	0	0	0	0	d848b2c2-9caf-4fe5-a47a-7bb2677ce41d	\N	2025-12-17 16:11:20.64	2025-12-17 16:11:20.64
a400ba3e-2a03-454a-bddc-e2643eb72d02	Axe Y Wilson 3 (AA)	Assemblage	Assemblage des composants de l'axe avant arri├¿re	\N	\N	0	0	0	0	d848b2c2-9caf-4fe5-a47a-7bb2677ce41d	\N	2025-12-17 16:11:21.453	2025-12-17 16:11:21.453
3728f066-83ae-4986-8cd0-37f59edbb4f0	Axe Y Wilson 3.5 (AA)	Assemblage	Assemblage des composants de l'axe avant arri├¿re	\N	\N	0	0	0	0	d848b2c2-9caf-4fe5-a47a-7bb2677ce41d	\N	2025-12-17 16:11:22.273	2025-12-17 16:11:22.273
cf2dfb3b-5b82-4a8e-a2fd-66f651c2b42b	Axe Z Falcon (HB)	Assemblage	Assemblage des composants de l'axe haut bas	\N	\N	0	0	0	0	d848b2c2-9caf-4fe5-a47a-7bb2677ce41d	\N	2025-12-17 16:11:23.229	2025-12-17 16:11:23.229
6a4a21e2-4c29-41c4-b8ec-f9290870911b	Axe Z Polisseur (HB)	Assemblage	Assemblage des composants de l'axe haut bas	\N	\N	0	0	0	0	d848b2c2-9caf-4fe5-a47a-7bb2677ce41d	\N	2025-12-17 16:11:24.059	2025-12-17 16:11:24.059
fb1fc192-083e-45a0-ae53-0817d497634a	Axe Z Predator (HB)	Assemblage	Assemblage des composants de l'axe haut bas	\N	\N	0	0	0	0	d848b2c2-9caf-4fe5-a47a-7bb2677ce41d	\N	2025-12-17 16:11:24.871	2025-12-17 16:11:24.871
f5e7c26a-79c6-4582-b526-43fecfeb16b1	Axe Z Terzago (HB)	Assemblage	Assemblage des composants de l'axe haut bas	\N	\N	0	0	0	0	d848b2c2-9caf-4fe5-a47a-7bb2677ce41d	\N	2025-12-17 16:11:25.683	2025-12-17 16:11:25.683
d0fcdf28-a4e5-4a22-93ab-ef0bec903e0b	Axe Z Wilson 3 (HB)	Assemblage	Assemblage des composants de l'axe haut bas	\N	\N	0	0	0	0	d848b2c2-9caf-4fe5-a47a-7bb2677ce41d	\N	2025-12-17 16:11:26.503	2025-12-17 16:11:26.503
98f9df87-8da6-4337-b428-53256ca043fd	Axe Z Wilson 3.5 (HB)	Assemblage	Assemblage des composants de l'axe haut bas	\N	\N	0	0	0	0	d848b2c2-9caf-4fe5-a47a-7bb2677ce41d	\N	2025-12-17 16:11:27.326	2025-12-17 16:11:27.326
4cf649f3-710d-4313-a22a-ac9b88ae8fb5	Batterie comp JD	PF31P7	Batterie qui va sur le compresseur John Deer		machineries Lourdes St-Raymond Inc	0	0	0	0	21af9639-ec83-4d6f-8495-e8f1e958d4f1	\N	2025-12-17 16:11:28.133	2025-12-17 16:11:28.133
e7547216-40ae-4361-a9b1-3cdc7b18c8ad	Bearing linear pour Noat	97 MO2 KWVE30BL G3V1	Roulement lin├®aire pour la Noat	\N	\N	0	0	0	0	81f0b475-9894-4557-851e-7b4c5910188f	\N	2025-12-17 16:11:28.943	2025-12-17 16:11:28.943
fdecf0fa-997a-4ffd-a513-64737ece4a5f	Bushing Pr├®dator	FLN24	Bushing qui permet ├á la t├¬te de la pr├®dator de ce d├®placer		APPLIED INSDUSTRIAL TECHNOLOGIES	0	4	0	0	81f0b475-9894-4557-851e-7b4c5910188f	\N	2025-12-17 16:11:29.756	2025-12-17 16:11:29.756
b3505fd8-e81d-419f-93a3-b71fae74ebd2	Cage de roulement driving shaft Falcon	FC214	Cage dans laquelle est ins├®rer le roulement du driving shaft de la Falcon		APPLIED INSDUSTRIAL TECHNOLOGIES	0	0	0	0	81f0b475-9894-4557-851e-7b4c5910188f	\N	2025-12-17 16:11:30.576	2025-12-17 16:11:30.576
2adf09d8-6820-4103-820f-a028ed7a1302	Cam follower Falcon AA	CFE 30-2 BUUR	Cam follower installer sur la Falcon qui enligne les rails du mouvement avant arri├¿re	IKO CFE 30-2 BUUR	\N	0	1	0	0	81f0b475-9894-4557-851e-7b4c5910188f	\N	2025-12-17 16:11:31.39	2025-12-17 16:11:31.39
bf48c286-9b8c-4f4d-9d6f-b5f43c340d0e	Cam follower Polisseur	CF 2 1/2 SB	Cam follower qui vont sur la t├¬te du polisseur		APPLIED INSDUSTRIAL TECHNOLOGIES	0	2	0	0	81f0b475-9894-4557-851e-7b4c5910188f	\N	2025-12-17 16:11:32.206	2025-12-17 16:11:32.206
cc454b06-1c77-461e-b206-407f9e45cb9a	Cam follower Wilson 3	CYR 2 3/4 S	Came situ├® sur la Wilson 3 m├¿tre qui aligne le d├®placement de gauche ├á droite	Mc GILL : CYR 2 3/4 S	APPLIED INSDUSTRIAL TECHNOLOGIES	0	0	0	0	81f0b475-9894-4557-851e-7b4c5910188f	\N	2025-12-17 16:11:33.041	2025-12-17 16:11:33.041
a6c997b7-c57a-44f7-99fb-f793beb23391	Capteur Wilson 3.5 GD	E2E-X10MF1-M1	Capteur de proximit├® servant de limit switch sur la Wilson 3.5 m├¿tre axe de gauche ├á droite	Omron E2E-X10MF1-M1	CALIBRATECK INC.	0	1	0	0	7ce9e29f-44e4-4955-aaba-91ca8aaaf9bf	\N	2025-12-17 16:11:33.867	2025-12-17 16:11:33.867
a68cbe42-d970-4c9f-91e8-138a5b34a521	Chauffe Moteur 1500 W 120 V	TEM8600287			Macpek inc.	0	1	0	0	21af9639-ec83-4d6f-8495-e8f1e958d4f1	973ff35f-639c-4ac4-8443-36715e176207	2025-12-17 16:11:35.267	2025-12-17 16:11:35.267
8da7c5a8-5cda-4f0e-89dc-33902d5fcd93	Contacteur Pont roulant 25T GD	3RA2324-8XB30-1AK6	Contacteur r├®versible du pont roulant 25T de gauche ├á droite	Gauche ├á droite si on regarde l'usine par les por	\N	0	1	0	0	78855d8d-b8e7-416c-b1d8-5c896a7c909d	\N	2025-12-17 16:11:36.117	2025-12-17 16:11:36.117
f9d69b4d-e2a2-481d-974b-6f05a9d22db6	Contacteur Pont roulant usine 4 HB	3RA2328-8XB30-1AK6	Contcteur du pont roulant situ├® ├á l'usine 4 qui permet de monter et descendre		MLE SERVICES	0	0	0	0	78855d8d-b8e7-416c-b1d8-5c896a7c909d	\N	2025-12-17 16:11:36.929	2025-12-17 16:11:36.929
880b6577-1133-43c2-b442-a4a443e43014	Coupe Courant	POL51902	Coupe courant aussi appel├® couteaux ├®lectrique		Macpek inc.	0	0	0	0	21af9639-ec83-4d6f-8495-e8f1e958d4f1	\N	2025-12-17 16:11:37.745	2025-12-17 16:11:37.745
1e48e9b6-b0cd-4d07-b1a7-e7391c51f440	Courroie moteur pr├®dator	8140253	Courroie reliant la poulie du moteur ├á la poulie du shaft de la pr├®dator		PARK INDUSTRIES\nAPPLIED INSDUSTRIAL TECHNOLOGIES	0	0	0	0	fc13feb8-70e6-4a8b-bffd-5d45e04b5ce0	\N	2025-12-17 16:11:38.692	2025-12-17 16:11:38.813
d5c2d839-49fb-40c4-9df0-bb3161349160	Courroie scie Pr├®dator	8140265	Courroie reliant la poulie de l'arbre central ├á l'arbre de la scie sur la pr├®dator.		PARK INDUSTRIES\nAPPLIED INSDUSTRIAL TECHNOLOGIES	0	0	0	0	fc13feb8-70e6-4a8b-bffd-5d45e04b5ce0	\N	2025-12-17 16:11:39.767	2025-12-17 16:11:39.909
c08f9f9a-43f7-4381-9ae3-7e29201be438	Engrenage terzago AA	C1302106	Engrenage de l'axe y avant arri├¿re install├® sur la Terzago		MARC PR├ëVOST MACHINERIE INC.	0	0	0	0	dd575bef-3b5b-4626-a2cd-5d0709c2c4c8	\N	2025-12-17 16:11:40.805	2025-12-17 16:11:40.805
af4f44d9-95cf-4f9d-a991-84b7d91025ab	Engrenage Terzago HB	C074140/01	Gros engrenage de l'axe Z de la Terzago	Num├®ro MPM: C074140/01	MARC PR├ëVOST MACHINERIE INC.	1	2	0	0	dd575bef-3b5b-4626-a2cd-5d0709c2c4c8	\N	2025-12-17 16:11:41.629	2025-12-17 16:11:41.629
b68c0cc8-fd72-48a1-8b3a-a3a3a54a5c8a	Engrenage Terzago HB	C074141/01	Petit engrenage de l'axe Z sur la Terzago	Num├®ro MPM: C074141/01	MARC PR├ëVOST MACHINERIE INC.	1	2	0	0	dd575bef-3b5b-4626-a2cd-5d0709c2c4c8	\N	2025-12-17 16:11:42.459	2025-12-17 16:11:42.459
561d4e46-a054-4bfb-a293-82f26157181a	Engrenage Wilson 3 AA	S-624	Engrenage qui active le d├®placement de l'axe avant arri├¿re de la Wilson 3		APPLIED INSDUSTRIAL TECHNOLOGIES	0	1	0	0	dd575bef-3b5b-4626-a2cd-5d0709c2c4c8	\N	2025-12-17 16:11:43.266	2025-12-17 16:11:43.266
31aa6c77-fde7-4951-9220-f067bafab2e3	Engrenage Wilson 3 GD	S320	Engrenage de l'axe X de gauche ├á droite sur la Wilson 3	S320	\N	0	1	0	0	dd575bef-3b5b-4626-a2cd-5d0709c2c4c8	\N	2025-12-17 16:11:44.096	2025-12-17 16:11:44.096
9b78a300-b5d9-437d-bcc2-a55609d4c0b1	Engrenage Wilson 3.5 AA	S520 14-1/2	Engrenage de la Wilson 3.5 de l'axe avant arri├¿re	Martin S520 14-1/2	\N	0	1	0	0	dd575bef-3b5b-4626-a2cd-5d0709c2c4c8	\N	2025-12-17 16:11:44.945	2025-12-17 16:11:44.945
98d87eb6-6639-4e8c-a6aa-36caaa04e8d7	Engrenage Wilson 3.5 GD	S514 14.5	Engrenage de l'axe X de gauche ├á droite sur la Wilson 3.5		HARVEY ROULEMENTS. BEARINGS	0	1	0	0	dd575bef-3b5b-4626-a2cd-5d0709c2c4c8	\N	2025-12-17 16:11:45.78	2025-12-17 16:11:45.78
009c01f0-3ad9-4da0-bc86-72c80be4f415	essai	a d├®truire	\N	\N	\N	0	0	0	0	81f0b475-9894-4557-851e-7b4c5910188f	aecddeee-cc79-45e1-98e8-4688c9962293	2025-12-17 16:11:47.163	2025-12-17 16:11:47.163
bb2bc36a-bf22-4652-a94c-8e112e8a073a	Fan de chauffrette Dresseur	TEM710025	Fan de la chauffrette du dresseur		Macpek inc.	0	0	0	0	21af9639-ec83-4d6f-8495-e8f1e958d4f1	\N	2025-12-17 16:11:48.093	2025-12-17 16:11:48.093
8bac491a-b160-43b3-91d3-c2a738adef8c	Filtre a gasoil	3682	\N	\N	\N	2	0	0	0	e3469558-15f3-4f94-bbcf-4bc996506c62	e970a6fd-2cd2-4a35-ba42-34df7b59dca0	2025-12-17 16:11:49.484	2025-12-17 16:11:49.484
ced3c6cb-d1ac-4f75-aef9-1a6ab69fb413	Filtre a huile	B161-S	\N	\N	\N	2	0	0	0	e3469558-15f3-4f94-bbcf-4bc996506c62	e970a6fd-2cd2-4a35-ba42-34df7b59dca0	2025-12-17 16:11:50.887	2025-12-17 16:11:50.887
2ba4f7a8-a58d-4037-9ed9-bc79fc4d9c37	Filtre a huile	BT310	\N	\N	\N	2	0	0	0	e3469558-15f3-4f94-bbcf-4bc996506c62	\N	2025-12-17 16:11:51.708	2025-12-17 16:11:51.708
cc16a7aa-19d9-42aa-99c2-cee62514b3bd	Filtre a huile hydraulique	WIX 51782	POUR TEREX	\N	\N	1	0	0	0	e3469558-15f3-4f94-bbcf-4bc996506c62	e970a6fd-2cd2-4a35-ba42-34df7b59dca0	2025-12-17 16:11:53.111	2025-12-17 16:11:53.111
6073d130-5687-4d1c-8a4d-81dacf9f6031	Filtre a huile hydraulique	N.R.	POUR TEREX	\N	\N	1	0	0	0	e3469558-15f3-4f94-bbcf-4bc996506c62	e970a6fd-2cd2-4a35-ba42-34df7b59dca0	2025-12-17 16:11:54.618	2025-12-17 16:11:54.618
02d67681-0c9c-4ea8-afec-8f0f8abfe456	Filtre air compresseur JD	1310033926	Filtre ├á air du compresseur John Deer	\N	\N	0	0	0	0	e3469558-15f3-4f94-bbcf-4bc996506c62	\N	2025-12-17 16:11:55.439	2025-12-17 16:11:55.439
84a1ef2f-8cd1-47e0-bcfc-533067079cae	Filtre air gros Dresseur	42637		Wix: 42637\nFleetguard: AF919	AGI St-Raymond	0	0	0	0	e3469558-15f3-4f94-bbcf-4bc996506c62	\N	2025-12-17 16:11:56.251	2025-12-17 16:11:56.37
3c7507d6-bf37-4fd1-ba32-27601cdd9533	Filtre air petit Dresseur	42638		Wix: 42638\nFleetguard: AF929	AGI St-Raymond	0	0	0	0	e3469558-15f3-4f94-bbcf-4bc996506c62	\N	2025-12-17 16:11:57.304	2025-12-17 16:11:57.424
7809e81c-3727-4a15-aab8-a32077a50742	Filtre air Volvo	4881174	Filtre ├á air du Volvo	Volvo: 4881174\nFleetgard: AF851M	machineries Lourdes St-Raymond Inc	0	0	0	0	e3469558-15f3-4f94-bbcf-4bc996506c62	\N	2025-12-17 16:11:58.297	2025-12-17 16:11:58.413
ec9cf695-0934-4bf6-abcf-2ac1b3d7185b	Filtre air Volvo	11007848	Filtre ├á air du Volvo	Volvo: 11007848\nFleetguard: AF25953	machineries Lourdes St-Raymond Inc	0	0	0	0	e3469558-15f3-4f94-bbcf-4bc996506c62	\N	2025-12-17 16:11:59.23	2025-12-17 16:11:59.35
077fdafd-309b-4096-9c26-313b929dfa19	Filtre air Volvo 2	4881175	Filtre ├á l'air du Volvo	Volvo: 4881175\nFleetguard: AF883M	machineries Lourdes St-Raymond Inc	0	0	0	0	e3469558-15f3-4f94-bbcf-4bc996506c62	\N	2025-12-17 16:12:00.172	2025-12-17 16:12:00.303
bffc099f-446d-4e09-808b-1a3f11a2ad13	Filtre air Volvo 3	6639203	Filtre ├á l'air du Volvo	Volvo: 6639203\nFleetguard: AF4106	machineries Lourdes St-Raymond Inc	0	0	0	0	e3469558-15f3-4f94-bbcf-4bc996506c62	\N	2025-12-17 16:12:01.142	2025-12-17 16:12:01.272
e62e4897-69a8-4a50-b335-c053b9f8039c	Filtre ├á air Volvo	11007847	Filtre ├á l'air du Volvo	Volvo: 11007847\nFleetguard: AF25954	machineries Lourdes St-Raymond Inc	0	0	0	0	e3469558-15f3-4f94-bbcf-4bc996506c62	\N	2025-12-17 16:12:02.094	2025-12-17 16:12:02.213
a742b4ef-a2f0-4db3-924c-0507d40f3d3f	Filtre Cat 988	42680	Filtre ├á air	No filtre: 42680	\N	0	0	0	0	e3469558-15f3-4f94-bbcf-4bc996506c62	\N	2025-12-17 16:12:03.042	2025-12-17 16:12:03.042
b71121b8-5e4a-496b-9b0e-cc72b043ce5e	Filtre Cat 988	51792	Filtre ├á l'huile	No filtre: 51792	\N	0	0	0	0	e3469558-15f3-4f94-bbcf-4bc996506c62	\N	2025-12-17 16:12:03.861	2025-12-17 16:12:03.861
39e92f5d-16b9-4024-aeb3-42c4bcee04c8	Filtre Cat 988	33384	Filtre ├á gaz	No filtre: 33384	\N	0	0	0	0	e3469558-15f3-4f94-bbcf-4bc996506c62	\N	2025-12-17 16:12:04.686	2025-12-17 16:12:04.686
2fc68b2a-77b9-44fc-b994-e6d7cf2cf5a3	Filtre Cat 988	33405	Filtre ├á gaz	No filtre: 33405	\N	0	0	0	0	e3469558-15f3-4f94-bbcf-4bc996506c62	\N	2025-12-17 16:12:05.506	2025-12-17 16:12:05.506
81625d30-f71f-4aec-b6bd-baa02994f25f	Filtre eau Dresseur	24071		Wix: 24071\nFleetguard: WF2051	\N	0	0	0	0	e3469558-15f3-4f94-bbcf-4bc996506c62	\N	2025-12-17 16:12:06.324	2025-12-17 16:12:06.443
947e8d13-5c19-4ffc-9b28-96d885df6daa	Filtre eau Volvo	1699830	Filtre ├á l'eau du moteur Volvo	Volvo: 1699830\nFleetguard: WF2096	machineries Lourdes St-Raymond Inc	0	0	0	0	e3469558-15f3-4f94-bbcf-4bc996506c62	\N	2025-12-17 16:12:07.257	2025-12-17 16:12:07.379
b269603f-ec9a-4d4c-97f5-2a5be0556f12	Filtre fuel Dresseur	33116		Wix: 33116\nFleetguard: FF202	\N	0	0	0	0	e3469558-15f3-4f94-bbcf-4bc996506c62	\N	2025-12-17 16:12:08.21	2025-12-17 16:12:08.329
6d51f5e3-d4e1-46eb-869b-74be95bfe784	Filtre fuel Volvo	466987	Filtre ├á fuel du moteur du Volvo	Volvo: 466987\nFleetguard: FF42000	machineries Lourdes St-Raymond Inc	0	0	0	0	e3469558-15f3-4f94-bbcf-4bc996506c62	\N	2025-12-17 16:12:09.256	2025-12-17 16:12:09.381
7ba07d48-2cea-4d0b-b4b2-097ac2f307a1	Filtre gaz comp JD	533752	Filtre ├á gaz	\N	\N	0	0	0	0	e3469558-15f3-4f94-bbcf-4bc996506c62	\N	2025-12-17 16:12:10.207	2025-12-17 16:12:10.207
772ac3e7-faa1-4466-b562-4f14a9f3ca60	Filtre huile comp JD	57076	Filtre ├á l'huile du moteur du compresseur	\N	\N	0	0	0	0	e3469558-15f3-4f94-bbcf-4bc996506c62	\N	2025-12-17 16:12:11.04	2025-12-17 16:12:11.04
90650c06-e8bc-48e7-b666-bd52b9b62bca	Filtre huile hydraulique Volvo	11026936	Filtre ├á l'huile hydraulique du Volvo	Volvo: 11026936\nFleetguard: HF28805	machineries Lourdes St-Raymond Inc	0	0	0	0	e3469558-15f3-4f94-bbcf-4bc996506c62	\N	2025-12-17 16:12:11.864	2025-12-17 16:12:12.073
0b5d0b5d-fa9c-47a1-8e7e-5546b16dc9e4	Filtre huile hydraulique Volvo	965899	Filtre pour l'huile hydraulique du Volvo	Volvo: 965899\nFleetguard: HF6586	machineries Lourdes St-Raymond Inc	0	0	0	0	e3469558-15f3-4f94-bbcf-4bc996506c62	\N	2025-12-17 16:12:12.879	2025-12-17 16:12:12.997
1fe92fb7-80b5-4dca-9c78-dc32b0abd95a	Filtre huile hydraulique Volvo 2	12973159	Filtre pour l'huile hydraulique du Volvo	Volvo: 12973159\nFleetguard: HF6451	machineries Lourdes St-Raymond Inc	0	0	0	0	e3469558-15f3-4f94-bbcf-4bc996506c62	\N	2025-12-17 16:12:13.825	2025-12-17 16:12:13.947
de4dc5d4-1d9e-42b0-8cd4-6dec1b0fa814	Filtre huile moteur Dresseur	51749		Wix:51749\nFleetguard: LF777	AGI St-Raymond	0	0	0	0	e3469558-15f3-4f94-bbcf-4bc996506c62	\N	2025-12-17 16:12:14.78	2025-12-17 16:12:14.911
3920ae96-c919-4fc2-af41-3fc61e1a84eb	Filtre huile moteur Volvo	466634	Filtreur pour l'huile du moteur du Volvo	Volvo: 466634\nFleetguard: LF3321	machineries Lourdes St-Raymond Inc	0	0	0	0	e3469558-15f3-4f94-bbcf-4bc996506c62	\N	2025-12-17 16:12:15.765	2025-12-17 16:12:15.888
ddfa118b-06ef-44ed-b4b1-46df18e64f59	Filtre huile moteur Volvo 2	477556	Filtreur ├á l'huile du moteur du volvo	Volvo: 477556\nFleetguard: LF3654	machineries Lourdes St-Raymond Inc	0	0	0	0	e3469558-15f3-4f94-bbcf-4bc996506c62	\N	2025-12-17 16:12:16.713	2025-12-17 16:12:16.893
90c1bf85-c16e-4de5-bb91-81a876b1e6f3	Filtre stainer huile moteur Dresseur	51954		Wix: 51954\nFleetguard: LF516	\N	0	0	0	0	e3469558-15f3-4f94-bbcf-4bc996506c62	\N	2025-12-17 16:12:17.715	2025-12-17 16:12:17.832
22a0a615-af63-4195-af0a-b755e1a89628	Filtre volvo ?	11006995	Je sais pas c'est quoi		machineries Lourdes St-Raymond Inc	0	0	0	0	e3469558-15f3-4f94-bbcf-4bc996506c62	\N	2025-12-17 16:12:18.644	2025-12-17 16:12:18.644
63e2db8d-dd10-4f6d-bb66-691fae6d4d40	Flow switch Wilson	We Anderson V8	interrupteur de d├®bit qui est installer sur les scie Wilson 3 et 3.5 m├¿tre	WE Anderson V8	ITM INSTRUMENTS	0	1	0	0	7ce9e29f-44e4-4955-aaba-91ca8aaaf9bf	\N	2025-12-17 16:12:19.457	2025-12-17 16:12:19.457
a7be2516-bfa6-4ea1-9dfb-9d0b3f5927ca	Limit switch Terzago HB	D4N-2120	Capteur de fin de course de l'axe des z haut bas	Omron D4N-2120	CALIBRATECK INC.	0	1	0	0	7ce9e29f-44e4-4955-aaba-91ca8aaaf9bf	\N	2025-12-17 16:12:28.335	2025-12-17 16:12:28.335
48870b64-ea50-47dc-b0ee-16374e4e6ec5	Frein moteur Wilson 3 (AA)	105672105PF	Frein du moteur de la Wilson 3 m├¿tre situ├® sur l'axe avant arri├¿re	Stearns 59BK2105-PF\nModel number: 105672105PF\nSer	\N	0	0	0	0	81a61b11-f0f1-464b-8a0e-825c5e3b7120	\N	2025-12-17 16:12:20.277	2025-12-17 16:12:20.513
55f33632-0a4e-4946-abbd-e4ebc5ddc90c	Maille chaine Explorer	81C1007	Maille de chaine qui permet au roue d'avancer sur l'Explorer		NOVAMAC INDUSTRIES INC	0	2	0	0	21af9639-ec83-4d6f-8495-e8f1e958d4f1	\N	2025-12-17 16:12:29.2	2025-12-17 16:12:29.2
ec2762d5-f00f-4158-82ae-a2b2ffde994a	Frein moteur Wilson 3.5 (AA)	C2006-551-R1DD	Frein du moteur de l'axe avant arri├¿re situ├® sur la Wilson 3.5 m├¿tre	Dings dynamic group\nModel: C2006-551-R1DD\nSerial	\N	0	0	0	0	81a61b11-f0f1-464b-8a0e-825c5e3b7120	\N	2025-12-17 16:12:21.345	2025-12-17 16:12:21.58
13a88f7b-7317-426c-bca5-5fe7eb153ad8	Joint caoutchouc	D123007	joint pour la table tournante	\N	\N	0	2	2	2	04d873e0-ca5a-4689-b0bd-710bd95e9c48	7d099478-d2cd-4729-8ef5-c59bb34bc519	2025-12-17 16:12:22.972	2025-12-17 16:12:22.972
2d4ff391-f5e3-41c4-86a4-ce38db400066	L095 1	N.R.	Jaw Coupling Hub		GENERAL BEARING SERVICE INC.	0	0	0	0	d848b2c2-9caf-4fe5-a47a-7bb2677ce41d	e970a6fd-2cd2-4a35-ba42-34df7b59dca0	2025-12-17 16:12:24.49	2025-12-17 16:12:24.49
7fd0d88c-52f5-426e-9704-4e32ffe4c80d	L095 7/8	N.R.		Jaw Coupling Hub	GENERAL BEARING SERVICE INC.	0	0	0	0	d848b2c2-9caf-4fe5-a47a-7bb2677ce41d	e970a6fd-2cd2-4a35-ba42-34df7b59dca0	2025-12-17 16:12:25.877	2025-12-17 16:12:25.877
651877a6-a7b6-48fd-9f76-dba9a6ffcad7	Limit switch Polisseur AA	D4A-1101N	Capteur de fin de course de l'axe avant arri├¿re	OMRON D4A-1101N	CALIBRATECK INC.	0	1	0	0	7ce9e29f-44e4-4955-aaba-91ca8aaaf9bf	\N	2025-12-17 16:12:26.699	2025-12-17 16:12:26.699
5dad1aca-27c8-4690-947d-f322dd3f71e0	Limit switch Terzago	D4A-1116N	Capteur de fin de course servant ├á ├®viter les collisions entre la roche et la partie fixer au centre de la scie	Omron D4A-1116N	CALIBRATECK INC.	0	1	2	2	7ce9e29f-44e4-4955-aaba-91ca8aaaf9bf	\N	2025-12-17 16:12:27.52	2025-12-17 16:12:27.52
d16bedb8-5e52-4c12-8a9e-65b31d2771d8	Moteur 2hp Polisseur (GD)	SRF4S2TCN61	Moteur 2 HP utilis├® sur l'axe gauche droite du polisseur	Lincoln motors\nModel: SRF4S2TCN61\nProduct: 6VK LM	\N	0	0	0	0	81a61b11-f0f1-464b-8a0e-825c5e3b7120	\N	2025-12-17 16:12:30.018	2025-12-17 16:12:30.259
cc32703c-770b-458b-967d-391016633815	Moteur 1/2HP (AA)	F56C 1/2M4A	Moteur de 1/2HP utilis├® sur plusieurs machines pour l'axe avant arri├¿re	Newport\nModel: F56C 1/2M4A\nFrame: 56C\nHP: 1/2\nNem	\N	0	0	0	0	81a61b11-f0f1-464b-8a0e-825c5e3b7120	\N	2025-12-17 16:12:31.075	2025-12-17 16:12:31.564
549537da-536b-4771-866f-832eb7c9e06a	Roue des scie Wilson	A d├®terminer	Roue utilis├® sur les rails de la Wlson 3 et 3.5 m├¿tres	\N	\N	0	1	1	0	7835c25d-a97b-48b7-9d8d-bdbcc8b6a40a	\N	2025-12-17 16:13:00.338	2025-12-17 16:13:00.338
9b9a0448-f1ac-481c-97e1-694597945102	Roue Falcon	BigWheel1000mm	Roue de 1000 mm de diametre	Aucun reference du fournisseur HUADA	HuaDa Superabrasive Tool	0	1	0	0	7835c25d-a97b-48b7-9d8d-bdbcc8b6a40a	2b43e6f3-b243-4f47-995a-adbe5e22271b	2025-12-17 16:13:01.753	2025-12-17 16:13:01.753
abbc47ff-0eb6-4bf5-84f7-1e5aa8c1e7c7	Moteur 2 HP (HB)	56C2M4D	Moteur de 2 hp utilis├® pour les d├®placement vertical haut et bas	Newport electronic motor\nModel: 56C2M4D\nFrame: 56	\N	0	0	0	0	81a61b11-f0f1-464b-8a0e-825c5e3b7120	\N	2025-12-17 16:12:32.385	2025-12-17 16:12:32.621
b3f3588e-2acd-4f43-b239-cd965c063f31	Poulie scie Pr├®dator	8130361	Poulie installer sur l'abre de la scie de la pr├®dtor	Abor sheave	PARK INDUSTRIES	0	0	0	0	7864c030-0014-4964-86b9-a590b6cac601	\N	2025-12-17 16:12:47.493	2025-12-17 16:12:47.493
eac6a671-bf7d-41cb-b7a7-1202146fbdb9	Moteur 2HP (GD)	YSN5664G	Moteur de 2 hp utilis├® sur plusieurs machines pour le d├®placement gauche droite	JRP Nema Frame 56C\nModel no: YSN5664G\nFrame: 56C	\N	0	0	0	0	81a61b11-f0f1-464b-8a0e-825c5e3b7120	\N	2025-12-17 16:12:33.44	2025-12-17 16:12:33.686
c5f3f634-089b-41b6-8646-9079aada2ca9	Moteur chauffrette Dresseur	TEM7100006	Moteur de chauffrette qui va sur le dresseur		Macpek inc.	0	0	0	0	81a61b11-f0f1-464b-8a0e-825c5e3b7120	\N	2025-12-17 16:12:34.505	2025-12-17 16:12:34.505
236a2915-2125-4e50-80ad-a6a3aa48dff6	Moteur hydraulique Explorer	PLM30 43S0-3255-LOF/0C N	Moteur hydraulique du compresseur sur l'exploreur	\N	\N	0	0	0	0	81a61b11-f0f1-464b-8a0e-825c5e3b7120	\N	2025-12-17 16:12:35.337	2025-12-17 16:12:35.337
f34af5d1-a4bb-4a9f-bc72-79f6f1bbe4e6	Pressure switch Dresseur	A-273541M1	Pressure switch qui active le son lorsque l'on recule avec le dresseur		machineries Lourdes St-Raymond Inc	0	0	0	0	7ce9e29f-44e4-4955-aaba-91ca8aaaf9bf	\N	2025-12-17 16:12:48.3	2025-12-17 16:12:48.3
6b6cb8b3-5a36-430e-996a-a265f3ea5b71	Moteur Terzago axe Z	SH-90S-4	Moteur de la Terzago qui active l'axe Z	Cantoni group\nType:SH-90S\nRPM: 1685 Fournisseur e	\N	0	0	0	0	81a61b11-f0f1-464b-8a0e-825c5e3b7120	\N	2025-12-17 16:12:36.158	2025-12-17 16:12:36.399
5a701d9b-b0ec-4722-a0f2-ec26bb0625a1	Moteur Volvo 330	TD164KAE	Information sur le moteur du Volvo 330	Engine family: WVSXL16.OCE1\nEngine model: TD164KA	\N	0	0	0	0	81a61b11-f0f1-464b-8a0e-825c5e3b7120	\N	2025-12-17 16:12:37.206	2025-12-17 16:12:37.324
f7d5bc07-24e8-4e0d-8c9f-519fd3aa853f	Protection Predator	8281020	Accord├®on de protection en dessous du pont (Bottom Bridge Bellow)		PARK INDUSTRIES	0	0	0	0	8ec85f9b-231e-4946-83da-66665a6a156e	\N	2025-12-17 16:12:49.116	2025-12-17 16:12:49.116
060d7d91-31cc-4e27-9c46-ee3ac0b99c1a	Protection Predator	8281021	Accordeon de protection du pont (Top way cover)		PARK INDUSTRIES	0	0	0	0	8ec85f9b-231e-4946-83da-66665a6a156e	\N	2025-12-17 16:12:49.927	2025-12-17 16:12:50.753
625621c3-ff3c-43b9-bcf7-3b2c7e91e363	Moteur Wilson 3.5 (GD)	1UUU7L0	Moteur servant au d├®placement gauche droite sur la Wilson 3.5 m├¿tre	JRP\nFrame: 56H\nS├ëRIE: 1UUU7L0\nHP: 2\nRPM: 1724	\N	0	0	0	0	81a61b11-f0f1-464b-8a0e-825c5e3b7120	\N	2025-12-17 16:12:38.139	2025-12-17 16:12:38.642
4c374a04-50e1-45ad-95e8-d834011dd07e	NP-28	N.R.	Ball Bearing Unit	Sealmaster NP-28\n700193 Ball Bearing Unit - Two-B	\N	2	2	0	0	81f0b475-9894-4557-851e-7b4c5910188f	e970a6fd-2cd2-4a35-ba42-34df7b59dca0	2025-12-17 16:12:40.143	2025-12-17 16:12:40.261
996aa441-9281-48d7-9c28-23635705a2ff	Nut en bronze - RH20125	N.R.	Nut en bronze pour vis sans fin up and down scie bleue		GENERAL BEARING SERVICE INC.	5	4	0	0	6e1919f5-210f-4e8e-bb44-b0f18ea18582	e970a6fd-2cd2-4a35-ba42-34df7b59dca0	2025-12-17 16:12:41.667	2025-12-17 16:12:41.667
42929441-d5af-45f5-a95b-d5d23e03ff3f	polisseur ressort t├¬te ├á martelage	300misc	Ressort install├® sur la t├¬te ├á marteler du polisseur	300misc spring for polishing plate	DERUSHA SUPPLY INC.	0	0	0	0	21af9639-ec83-4d6f-8495-e8f1e958d4f1	\N	2025-12-17 16:12:42.475	2025-12-17 16:12:42.475
13a53c2c-6d26-4497-897c-3f56b101569c	Polisseur t├¬te ├á martelage	23014542	Pi├¿ce qui se monte sur le polisseur qui donne un fini martel├® ├á la pierre		DERUSHA SUPPLY INC.	0	1	0	0	21af9639-ec83-4d6f-8495-e8f1e958d4f1	\N	2025-12-17 16:12:43.291	2025-12-17 16:12:43.291
fc165c02-e757-4ae8-a1e1-dfac7f99d002	Pompe eau propre	20WA15S4-PE	Pompe pour l'eau propre ├á l'usine 2	Franklin electric (Water horse)\nModel: 20WA15S4-P	\N	0	0	0	0	21af9639-ec83-4d6f-8495-e8f1e958d4f1	\N	2025-12-17 16:12:44.108	2025-12-17 16:12:44.228
91b61060-f75c-43c3-9c19-e1d9a94c6860	Poulie arbre Pr├®dator moteur	8130249	Jack shaft sheave	Poulie installer sur le shaft qui est reli├® par l	PARK INDUSTRIES	0	0	0	0	7864c030-0014-4964-86b9-a590b6cac601	\N	2025-12-17 16:12:45.044	2025-12-17 16:12:45.044
69e1eef4-7b4b-4661-9a4b-7fef75b0aa84	Poulie arbre Pr├®dator scie	8130357	Poulie install├® sur l'arbre central relier par la courroie ├á l'arbre de la scie		PARK INDUSTRIES	0	0	0	0	7864c030-0014-4964-86b9-a590b6cac601	\N	2025-12-17 16:12:45.87	2025-12-17 16:12:45.87
f09e5fb3-6c57-45fd-8b8f-7654274e15c0	Poulie moteur Pr├®dator	8130273	Motor sheave		PARK INDUSTRIES	0	0	0	0	7864c030-0014-4964-86b9-a590b6cac601	\N	2025-12-17 16:12:46.687	2025-12-17 16:12:46.687
65d2fcc8-26c1-4e57-bcdf-bd9ded04af34	R├®ducteur Terzago HB	A102 UH25 F1A 23.8 S1 VA PAM80	R├®ducteur de vitesse du moteur de l'axe haut bas situ├® sur la Terzago		MARC PR├ëVOST MACHINERIE INC.	1	0	0	0	e3a06348-508e-4787-bc00-e2f50c646d2b	\N	2025-12-17 16:12:53.867	2025-12-17 16:12:53.867
20008c4a-d693-40f8-8e8f-b26fdafdec4e	R├®ducteur Polisseur AA	GR8240558.23	R├®ducteur de vitesse du moteur de l'axe avant arri├¿re situ├® sur le polisseur	Ironman by Grove Gear\nCatalog #: GR8240558.23\nMod	\N	0	0	0	0	e3a06348-508e-4787-bc00-e2f50c646d2b	\N	2025-12-17 16:12:51.694	2025-12-17 16:12:51.934
89adf038-3fe0-4bd6-ade6-c46b9e9a9aef	R├®ducteur Polisseur GD	HM224-1		Grove gear\nModel No: HM2241-1\nSerial no: 30033051	\N	0	0	0	0	e3a06348-508e-4787-bc00-e2f50c646d2b	\N	2025-12-17 16:12:52.754	2025-12-17 16:12:52.99
ee7345b5-c5df-46f8-8270-c07697f38482	R├®ducteur Wilson 3 AA	?	R├®ducteur de vitesse du moteur de l'axe avant arri├¿re situ├® sur la Wilson 3 m├¿tre	Pas de marque seulement des num├®ro\n33N-560\n991740	\N	0	0	0	0	e3a06348-508e-4787-bc00-e2f50c646d2b	\N	2025-12-17 16:12:54.684	2025-12-17 16:12:54.925
4d14ed10-2a58-405e-b5b0-c9235f7aac15	R├®ducteur Wilson 3 GD	M3213BAH60A	R├®ducteur de vitesse du moteur de l'axe gauche droite situ├® sur la Wilson 3 m├¿tre	Cleveland Gear\nModel no: M3213BAH60A\nType: 1CHS\nS	\N	0	0	0	0	e3a06348-508e-4787-bc00-e2f50c646d2b	\N	2025-12-17 16:12:55.854	2025-12-17 16:12:56.829
48a36be7-92a4-4627-b890-7e8eeb615052	R├®ducteur Wilson 3.5 AA	?	R├®ducteur de vitesse du moteur de l'axe avant arri├¿re situ├® sur la Wilson 3.5 m├¿tre	Pas de marque seulement des chiffres sur une plaq	\N	0	0	0	0	e3a06348-508e-4787-bc00-e2f50c646d2b	\N	2025-12-17 16:12:58.703	2025-12-17 16:12:58.703
7233b75c-633e-46e4-b9dd-731a9381112f	R├®ducteur Wilson 3 HB	232BQ025562	R├®ducteur de vitesse du moteur de l'axe haut bas situ├® sur la Wilson 3 m├¿tre	Sterling electric| inc\nFrame no: 232BQ025562\nSeri	\N	0	0	0	0	e3a06348-508e-4787-bc00-e2f50c646d2b	\N	2025-12-17 16:12:57.64	2025-12-17 16:12:57.883
60a75152-dec0-4557-875e-6b89cea1e32e	RH12125 Vis sans fin	N.R.			GENERAL BEARING SERVICE INC.	0	0	0	0	d848b2c2-9caf-4fe5-a47a-7bb2677ce41d	\N	2025-12-17 16:12:59.52	2025-12-17 16:12:59.52
f81e15ef-2329-4e95-b9d5-fd7f647f1502	Roulement convoyeur entrer splitter	UCFB 28-24	Roulement qui vont ├á l'avant du convoyeur ├á l'entr├® de la guillotine	Casting: FB208\nBearing: UC208-24	APPLIED INSDUSTRIAL TECHNOLOGIES	0	1	0	0	81f0b475-9894-4557-851e-7b4c5910188f	\N	2025-12-17 16:13:02.581	2025-12-17 16:13:02.709
10e70522-dc95-4498-b8ca-114592c0abf8	Roulement convoyeur sortie splitteur	FRANTZ-2532	Roulement du convoyeur ├á rouleaux ├á la sortie du splitter		APPLIED INSDUSTRIAL TECHNOLOGIES	0	6	0	0	81f0b475-9894-4557-851e-7b4c5910188f	\N	2025-12-17 16:13:03.517	2025-12-17 16:13:03.517
6ace45d5-f072-4805-a67a-f1a612d6f0d1	Roulement des roues Falcon AA	UCP212D1	Roulement pour les roues d├®placement avant arri├¿re de la Falcon	NTN UCP212D1	APPLIED INSDUSTRIAL TECHNOLOGIES	0	0	0	0	81f0b475-9894-4557-851e-7b4c5910188f	\N	2025-12-17 16:13:04.345	2025-12-17 16:13:04.345
4072bf8b-8b70-4ff9-b13a-74f1354388cc	Roulement driving shaft Falcon	UC214D1	Roulement fix├® ├á l'arbre qui transmet la puissance sur la Falcon		APPLIED INSDUSTRIAL TECHNOLOGIES	0	0	0	0	81f0b475-9894-4557-851e-7b4c5910188f	\N	2025-12-17 16:13:05.162	2025-12-17 16:13:05.162
c206d6bc-dcdc-43b6-8db5-ce2a011da095	Roulement driving shaft Terzago	30215M-90KM1	Roulement fixer ├á l'arbre de la scie du c├┤t├® de la scie sur la Terzago	Timken 30215M-90KM1	\N	0	0	0	0	81f0b475-9894-4557-851e-7b4c5910188f	\N	2025-12-17 16:13:05.983	2025-12-17 16:13:05.983
afbdb206-be43-4f74-8be8-f5f5d9ac3092	Roulement driving shaft Terzago	NU2312-E-TVP2-C3	Roulement fixer ├á l'arbre de la scie du c├┤t├® de la poulie sur la Terzago		APPLIED INSDUSTRIAL TECHNOLOGIES	0	1	0	0	81f0b475-9894-4557-851e-7b4c5910188f	\N	2025-12-17 16:13:06.8	2025-12-17 16:13:06.8
8bad36e2-e4bb-4b07-80dd-fedd80b8c371	Roulement Falcon HB	R151341013	Roulement lin├®aire en haut de l'axe haut bas	Rexroth R151341013	\N	0	1	0	0	81f0b475-9894-4557-851e-7b4c5910188f	\N	2025-12-17 16:13:07.618	2025-12-17 16:13:07.618
c65b8640-98f9-4008-8a06-39261d0b48bf	Roulement lin├®aire Terzago HB	R151344013	Roulement lin├®aire qui va sur la Terzago	\N	\N	0	2	2	0	81f0b475-9894-4557-851e-7b4c5910188f	\N	2025-12-17 16:13:08.445	2025-12-17 16:13:08.445
77f07ffb-8ea5-414b-8eda-1054e3a1b355	SKF 6208-2RS1	N.R.	Flange-Mount Ball Bearing Unit - 4-Bolt	\N	\N	3	4	0	0	6e1919f5-210f-4e8e-bb44-b0f18ea18582	e970a6fd-2cd2-4a35-ba42-34df7b59dca0	2025-12-17 16:13:19.781	2025-12-17 16:13:19.781
544e6db0-04ee-4582-9a76-03b1390cfd96	Roulement plat Terzago HB	D14328	Roulement ├á plat qui va sur l'arbre de l'axe Z de la Terzago	Num├®ro mpm: D104328\nNum├®ro skf: 51205\nPr├®f├®r├® skf	APPLIED INSDUSTRIAL TECHNOLOGIES	0	1	0	0	81f0b475-9894-4557-851e-7b4c5910188f	\N	2025-12-17 16:13:09.257	2025-12-17 16:13:09.497
3fdd493e-8a09-436e-be85-03bbf717884e	Roulement Pr├®dator	8070171-1	Bearing de y et z sur la predator		PARK INDUSTRIES	0	9	0	0	81f0b475-9894-4557-851e-7b4c5910188f	7d099478-d2cd-4729-8ef5-c59bb34bc519	2025-12-17 16:13:11.023	2025-12-17 16:13:11.023
ba5632e3-7a23-4244-a686-769e044581fe	Socle Wilson roue	3994	Socle du roulement pour les roue Wilson 3 et 3.5	Socle dans lequel s'appuie les bearings situ├® dan	HARVEY ROULEMENTS. BEARINGS	0	2	4	8	81f0b475-9894-4557-851e-7b4c5910188f	\N	2025-12-17 16:13:20.607	2025-12-17 16:13:20.607
7eecd1ef-bc81-46fe-8250-09773e50d515	Roulement support d'arbre Terzago HB	D105010	Roulement de support de l'arbre qui va sur l'axe Z de la Terzago	Num├®ro MPM: D105010\nNum├®ro NTN: ASS205N\nPr├®f├®r├® s	APPLIED INSDUSTRIAL TECHNOLOGIES	0	2	0	0	81f0b475-9894-4557-851e-7b4c5910188f	\N	2025-12-17 16:13:11.842	2025-12-17 16:13:12.082
3d13967f-8394-4e03-9e59-ad5c523300f8	Sol├®noide Dresseur	66-123	Sol├®noide du strater du Dresseur	SOLENOID 37MT 24V	machineries Lourdes St-Raymond Inc	0	0	0	0	78855d8d-b8e7-416c-b1d8-5c896a7c909d	\N	2025-12-17 16:13:21.455	2025-12-17 16:13:21.455
9da91b53-9df8-400d-94b0-6c5c775392b3	Roulement support vis terzago HB	D104173	Roulement qui supporte les vis sans fin de l'axe Z sur la Terzago	Num├®ro MPM: D104173\nNum├®ro NSK: 3206B2RSTNGC3\nPr├®	APPLIED INSDUSTRIAL TECHNOLOGIES	0	2	0	0	81f0b475-9894-4557-851e-7b4c5910188f	\N	2025-12-17 16:13:12.9	2025-12-17 16:13:13.138
171d9ad7-27f7-4310-a9ba-8c84b422f078	Roulement Wilson roue	3920	Bearing situ├® ├á l'int├®rieur des roues de la Wilson 3 et 3.5 m├¿tre	Roulement situ├® ├á l'int├®rieur des roues de la Wil	HARVEY ROULEMENTS. BEARINGS	0	2	4	8	81f0b475-9894-4557-851e-7b4c5910188f	\N	2025-12-17 16:13:13.95	2025-12-17 16:13:13.95
026d5d3c-7ac9-4993-8dcc-4cfd640f6038	S614BS 1	N.R.			GENERAL BEARING SERVICE INC.	0	0	0	0	dd575bef-3b5b-4626-a2cd-5d0709c2c4c8	e970a6fd-2cd2-4a35-ba42-34df7b59dca0	2025-12-17 16:13:15.346	2025-12-17 16:13:15.346
6ed6cb69-335c-4125-80c1-c0b39da677d6	Seal de roue Wilson	415088	Seal de roue pour la Wlson 3 et 3.5 m├¿tre	Seal de roue pour la Wilson 3 et 3.5 m├¿tre il y e	HARVEY ROULEMENTS. BEARINGS	0	2	4	8	81f0b475-9894-4557-851e-7b4c5910188f	\N	2025-12-17 16:13:16.163	2025-12-17 16:13:16.163
479725cf-45ab-4dd8-b2d1-e8509a47c4a4	Seal shaft scie Terzago	90-110-12	Seal qui sont poser avec les roulement sur le shaft de la scie de la Terzago		APPLIED INSDUSTRIAL TECHNOLOGIES	0	2	0	0	81f0b475-9894-4557-851e-7b4c5910188f	\N	2025-12-17 16:13:16.996	2025-12-17 16:13:16.996
a73fb6d4-98f3-4a14-8d22-fd9479cf2102	S├®parateur carburant/eau	N.R.	3732	\N	\N	3	0	0	0	6e1919f5-210f-4e8e-bb44-b0f18ea18582	e970a6fd-2cd2-4a35-ba42-34df7b59dca0	2025-12-17 16:13:18.4	2025-12-17 16:13:18.4
ec0224c3-3161-43d1-b5f5-fba0fc517ebd	SPIDER L090/L095	N.R.	Jaw Coupling Insert		GENERAL BEARING SERVICE INC.	0	0	0	0	d848b2c2-9caf-4fe5-a47a-7bb2677ce41d	e970a6fd-2cd2-4a35-ba42-34df7b59dca0	2025-12-17 16:13:22.839	2025-12-17 16:13:22.839
6f45a1ab-76b4-47f6-8be9-e53610123404	Spring Washer	D128076	Spring washer pour table terzago		MARC PR├ëVOST MACHINERIE INC.	0	2	2	2	04d873e0-ca5a-4689-b0bd-710bd95e9c48	7d099478-d2cd-4729-8ef5-c59bb34bc519	2025-12-17 16:13:24.228	2025-12-17 16:13:24.228
7edbf5c7-7ee6-4bd8-b28a-20d63d4c92f1	Tige fillett├®e 5/8 GRADE 8	N.R.			DIST. J.M. BERGERON	6	0	0	0	6e1919f5-210f-4e8e-bb44-b0f18ea18582	c86fc66d-ff9f-4fb9-bd2b-1c15a1c80a99	2025-12-17 16:13:25.821	2025-12-17 16:13:25.821
ea01be54-0fdd-4c17-a4a8-a27173a88bfb	UCFU-3/4M	N.R.	Roulements vis sans fin axe Z	Marque en stock : NTN\nFournisseur habituel : G├®n├®	GENERAL BEARING SERVICE INC.	3	2	0	0	81f0b475-9894-4557-851e-7b4c5910188f	e970a6fd-2cd2-4a35-ba42-34df7b59dca0	2025-12-17 16:13:27.225	2025-12-17 16:13:27.345
957e94d5-f780-4574-b243-9c6ce449f8a0	X30210 Tapered Roller Bearings	N.R.	This is the most basic and most widely used type of tapered roller bearing. It consists of two main separable parts: the cone (inner ring) assembly and the cup (outer ring). It is typically mounted in opposing pairs on a shaft.	\N	\N	2	0	0	0	81f0b475-9894-4557-851e-7b4c5910188f	e970a6fd-2cd2-4a35-ba42-34df7b59dca0	2025-12-17 16:13:28.737	2025-12-17 16:13:28.737
\.


--
-- Data for Name: PartCategory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PartCategory" (id, name, "createdAt", "updatedAt") FROM stdin;
d848b2c2-9caf-4fe5-a47a-7bb2677ce41d	Assemblage	2025-12-17 16:07:17.613	2025-12-17 16:07:17.613
21af9639-ec83-4d6f-8495-e8f1e958d4f1	Autres	2025-12-17 16:07:18.534	2025-12-17 16:07:18.534
7ce9e29f-44e4-4955-aaba-91ca8aaaf9bf	Capteur	2025-12-17 16:07:19.114	2025-12-17 16:07:19.114
95e1c06c-ac13-4d05-82d5-429b38706fcd	Consommable	2025-12-17 16:07:19.703	2025-12-17 16:07:19.703
78855d8d-b8e7-416c-b1d8-5c896a7c909d	Contacteur	2025-12-17 16:07:20.289	2025-12-17 16:07:20.289
fc13feb8-70e6-4a8b-bffd-5d45e04b5ce0	Courroie	2025-12-17 16:07:20.881	2025-12-17 16:07:20.881
dd575bef-3b5b-4626-a2cd-5d0709c2c4c8	Engrenage	2025-12-17 16:07:21.482	2025-12-17 16:07:21.482
e3469558-15f3-4f94-bbcf-4bc996506c62	Filtre	2025-12-17 16:07:22.068	2025-12-17 16:07:22.068
04d873e0-ca5a-4689-b0bd-710bd95e9c48	Joint	2025-12-17 16:07:22.643	2025-12-17 16:07:22.643
81a61b11-f0f1-464b-8a0e-825c5e3b7120	Moteur	2025-12-17 16:07:23.223	2025-12-17 16:07:23.223
6e1919f5-210f-4e8e-bb44-b0f18ea18582	N.D.	2025-12-17 16:07:23.806	2025-12-17 16:07:23.806
7864c030-0014-4964-86b9-a590b6cac601	Poulie	2025-12-17 16:07:24.411	2025-12-17 16:07:24.411
8ec85f9b-231e-4946-83da-66665a6a156e	Protection	2025-12-17 16:07:24.99	2025-12-17 16:07:24.99
e3a06348-508e-4787-bc00-e2f50c646d2b	R├®ducteur	2025-12-17 16:07:25.575	2025-12-17 16:07:25.575
7835c25d-a97b-48b7-9d8d-bdbcc8b6a40a	Roue	2025-12-17 16:07:26.658	2025-12-17 16:07:26.658
81f0b475-9894-4557-851e-7b4c5910188f	Roulement	2025-12-17 16:07:27.231	2025-12-17 16:07:27.231
\.


--
-- Data for Name: PaymentTerm; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PaymentTerm" (id, code, label_en, label_fr, days, "depositPercentage", "discountPercentage", "discountDays", "requiresText", "createdAt", "updatedAt") FROM stdin;
53489ce0-25b5-435c-b234-ae12e445edbf	1	Payment upon confirmation of order	Paiement ├á la commande	0	0	0	0	f	2025-12-13 01:43:39.222	2025-12-13 16:43:05.839
c38fd45c-356b-4b5e-a9a0-3c2258201d9e	2	% deposit on confirmation of order, balance before delivery	% de d├®p├┤t ├á la commande, le solde avant exp├®dition	0	50	0	0	f	2025-12-13 01:43:39.223	2025-12-13 16:43:05.841
bbafa2cc-144b-48cc-a06d-5d144f473141	3	% deposit on confirmation of order, balance net days after date of production	% de d├®p├┤t ├á la commande, le solde jours net apr├¿s date de production	30	0	0	0	f	2025-12-13 01:43:39.224	2025-12-13 16:43:05.842
bcee4fc8-48c5-4b3d-9c95-8d5f16ac53a9	4	net days and % discount if payment by WIRE TRANSFER is received before days from date of invoice	net jours avec % d'escompte si paiement re├ºu par VIREMENT BANCAIRE chez DRC avant jours net date de facturation	35	0	7	10	f	2025-12-13 16:32:16.257	2025-12-13 16:43:05.843
a3952689-f898-4c05-b91d-301e68feecdd	5	net days of date of invoice	net jours apr├¿s date de facturation	35	0	0	0	f	2025-12-13 16:32:16.257	2025-12-13 16:43:05.843
8fb7f06a-5992-4dcd-8801-33f556cadb2d	6	Terms to be confirmed	A d├®terminer	0	0	0	0	f	2025-12-13 16:32:16.258	2025-12-13 16:43:05.844
0ec8964e-8a6a-45c1-8e27-6efc4aeabde9	7	Manual entry	Saisie manuelle	0	0	0	0	t	2025-12-13 16:32:16.259	2025-12-13 16:43:05.844
d8a9466c-dba8-4d3e-968a-0668f5722216	8	% deposit on confirmation of order and % discount on balance if payment received before days from date of invoice	% de d├®p├┤t ├á la commande et % de remise sur le solde si paiement re├ºu sous jours	35	20	7	10	f	2025-12-13 16:32:16.259	2025-12-13 16:43:05.845
\.


--
-- Data for Name: ProductionSite; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProductionSite" (id, name, "createdAt", "updatedAt") FROM stdin;
695cf438-9350-4392-87cd-5195851bfe91	Usines Rap	2025-12-13 02:06:11.515	2025-12-13 02:06:11.515
52cf87d1-6925-4dcb-b3aa-418c42d2a0eb	Usine 4 Ogden	2025-12-13 02:06:19.129	2025-12-13 02:06:19.129
fc0159b8-a1af-48a9-8b2e-f9dca0e4d3a5	Usine 6 Ogden	2025-12-13 02:06:26.079	2025-12-13 02:06:26.079
9e7a58ba-43b1-4fd4-b919-821c9a2bcfa7	Usine 5 Ogden	2025-12-13 02:06:34.866	2025-12-13 02:06:34.866
2e404c00-73f6-4573-a21d-90b182706c7c	Carri├¿re S&P Ogden	2025-12-13 02:06:51.709	2025-12-13 02:06:51.709
\.


--
-- Data for Name: Project; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Project" (id, name, reference, status, "thirdPartyId", "locationId", "measureSystem", "estimatedWeeks", "numberOfLines", "createdAt", "updatedAt") FROM stdin;
4fa415a5-dd85-4099-aa08-dde0b2a9f22f	essai5	P25-0001	Prospect	\N	59260712-6c14-4a24-b693-591f55dceaa0	Imperial	3	5	2025-12-14 22:48:25.603	2025-12-17 15:12:08.841
\.


--
-- Data for Name: ProjectLocation; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProjectLocation" (id, name, "createdAt", "updatedAt") FROM stdin;
e010bd9d-7d01-4ca2-b7b4-04e8697f781c	Montreal	2025-12-13 02:07:03.099	2025-12-13 02:07:03.099
cb7d351b-118f-493d-af5f-8703380ce66b	Quebec	2025-12-13 02:07:06.679	2025-12-13 02:07:06.679
3d015c75-54e7-4ad7-b1fe-a3559ffc3fa8	Vermont	2025-12-13 02:07:13.082	2025-12-13 02:07:13.082
59260712-6c14-4a24-b693-591f55dceaa0	Mass	2025-12-13 02:07:21.547	2025-12-13 02:07:21.547
7cb25003-def9-4a52-976e-ac7d10dd5223	New Hampshire	2025-12-13 02:07:28.658	2025-12-13 02:07:28.658
d8f568a7-75d3-4cf6-be6a-184f909737ff	New York City	2025-12-13 02:07:39.712	2025-12-13 02:07:39.712
\.


--
-- Data for Name: Quote; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Quote" (id, reference, version, currency, "exchangeRate", incoterm, "incotermId", "incotermCustomText", "semiStandardRate", "salesCurrency", "palletPrice", "palletRequired", "paymentTermId", "paymentDays", "depositPercentage", "discountPercentage", "paymentCustomText", status, "projectId", "thirdPartyId", "contactId", "materialId", "dateIssued", "validUntil", "totalAmount", "estimatedWeeks", "excelFilePath", "syncStatus", "odooId", "odooStatus", "createdAt", "updatedAt", "discountDays", "validityDuration", "representativeId") FROM stdin;
236e59e5-9d8c-4caa-8f9b-f86859c0e11e	DRC25-0001-C0R0	1	CAD	1	FOB	96e8bd0e-67dd-412b-81b7-49f7e8cef1e0	\N	1.4	CAD	9	f	c38fd45c-356b-4b5e-a9a0-3c2258201d9e	27	30	0		Draft	4fa415a5-dd85-4099-aa08-dde0b2a9f22f	a7a8ab30-b59c-42e3-815b-e15021300db0	ea1ace0b-5219-492e-8607-0a6a37906618	d10cf632-92eb-4d81-9135-14b56cfec49f	2025-12-17 15:12:08.832	\N	7154.5	3	\N	Synced	\N	\N	2025-12-17 15:12:08.832	2025-12-17 15:13:30.891	0	31	08e1b673-ba1d-4e45-9c85-8083023a441f
\.


--
-- Data for Name: QuoteItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."QuoteItem" (id, "quoteId", tag, "lineNo", "refReference", product, description, material, finish, unit, length, width, thickness, quantity, "numHoles", "numSlots", "netLength", "netArea", "netVolume", "totalWeight", "unitPrice", "totalPrice", "unitPriceInternal", "totalPriceInternal", "unitPriceCad", "unitPriceUsd", "totalPriceCad", "totalPriceUsd", "stoneValue", "primarySawingCost", "secondarySawingCost", "profilingCost", "finishingCost", "anchoringCost", "unitTime", "totalTime", "productionStatus", "productionSiteId", "productionNotes", "createdAt", "updatedAt") FROM stdin;
59786377-d99f-4eb4-acc8-10c7d54bfbb0	236e59e5-9d8c-4caa-8f9b-f86859c0e11e	001-1	L1	\N	step	A renseigner	Caledonia	\N	ea	96	24	7	1	0	0	8	16	9.3333	1633.333333	1430.9	1430.9	1430.9	1430.9	0	0	0	0	444.1926	78.1155555555555	43.75	0	0	0	2.03109259259259	2.03109259259259	Pending	\N	\N	2025-12-17 15:13:30.885	2025-12-17 15:13:30.885
1ee36343-65b2-449d-bc7e-e1e123e326ef	236e59e5-9d8c-4caa-8f9b-f86859c0e11e	001-2	L2	\N	step	A renseigner	Caledonia	\N	ea	96	24	7	1	0	0	8	16	9.3333	1633.333333	1430.9	1430.9	1430.9	1430.9	0	0	0	0	444.1926	78.1155555555555	43.75	0	0	0	2.03109259259259	2.03109259259259	Pending	\N	\N	2025-12-17 15:13:30.885	2025-12-17 15:13:30.885
394c7f4a-0661-4cc9-86a6-60006a89d481	236e59e5-9d8c-4caa-8f9b-f86859c0e11e	001-3	L3	\N	step	A renseigner	Caledonia	\N	ea	96	24	7	1	0	0	8	16	9.3333	1633.333333	1430.9	1430.9	1430.9	1430.9	0	0	0	0	444.1926	78.1155555555555	43.75	0	0	0	2.03109259259259	2.03109259259259	Pending	\N	\N	2025-12-17 15:13:30.885	2025-12-17 15:13:30.885
03b3e73d-4563-4511-885f-4c45487cfb84	236e59e5-9d8c-4caa-8f9b-f86859c0e11e	001-4	L4	\N	step	A renseigner	Caledonia	\N	ea	96	24	7	1	0	0	8	16	9.3333	1633.333333	1430.9	1430.9	1430.9	1430.9	0	0	0	0	444.1926	78.1155555555555	43.75	0	0	0	2.03109259259259	2.03109259259259	Pending	\N	\N	2025-12-17 15:13:30.885	2025-12-17 15:13:30.885
8546ac24-e894-488c-8670-9fcc58eae804	236e59e5-9d8c-4caa-8f9b-f86859c0e11e	001-5	L5	\N	step	A renseigner	Caledonia	\N	ea	96	24	7	1	0	0	8	16	9.3333	1633.333333	1430.9	1430.9	1430.9	1430.9	0	0	0	0	444.1926	78.1155555555555	43.75	0	0	0	2.03109259259259	2.03109259259259	Pending	\N	\N	2025-12-17 15:13:30.885	2025-12-17 15:13:30.885
\.


--
-- Data for Name: RepairPart; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."RepairPart" (id, "repairRequestId", "partId", quantity, action, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: RepairRequest; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."RepairRequest" (id, reference, "equipmentId", title, description, priority, status, requester, mechanic, "isMachineDown", "isFunctional", "detectionDate", "dueDate", "closedAt", type, "recurrenceFreq", "recurrenceDay", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Representative; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Representative" (id, "firstName", "lastName", email, phone, mobile, fax, active, "createdAt", "updatedAt") FROM stdin;
8e9305fa-982f-43f4-bad0-de1104fc73a8	Steve	Pouliot	spouliot@stoneatlantic.com	(418) 559-9423	(418) 559-9423		t	2025-12-13 02:08:49.678	2025-12-13 02:08:49.678
08e1b673-ba1d-4e45-9c85-8083023a441f	Thomas	Leguen de Kergolan	thomasldk@granitedrc.com		+1 (514) 928-5195		t	2025-12-13 18:37:16.766	2025-12-13 18:37:16.766
\.


--
-- Data for Name: Setting; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Setting" (id, key, value, description, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: SystemConfig; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SystemConfig" (id, key, "defaultSemiStandardRate", "defaultSalesCurrency", "defaultPalletPrice", "defaultPalletRequired", "defaultPaymentDays", "defaultDepositPercentage", "defaultDiscountPercentage", "defaultDiscountDays", "defaultExchangeRate", "defaultPaymentTermId", "taxRateTPS", "taxRateTVQ", "taxRateTVH", "taxRateTVH_Maritimes", "defaultMeasureUnit", "defaultValidityDuration", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ThirdParty; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ThirdParty" (id, name, type, code, email, phone, fax, website, "defaultCurrency", "paymentTerms", "paymentTermId", "paymentDays", "depositPercentage", "discountPercentage", "discountDays", "paymentCustomText", "supplierType", "taxScheme", "creditLimit", "repName", language, "unitSystem", incoterm, "incotermId", "incotermCustomText", "priceListUrl", "priceListDate", "semiStandardRate", "salesCurrency", "palletPrice", "palletRequired", "internalNotes", "createdAt", "updatedAt", "exchangeRate", "validityDuration") FROM stdin;
a7a8ab30-b59c-42e3-815b-e15021300db0	Construction Exemplaire Inc.	Client	CONEXE	info@constructionexemplaire.com	+1 (450) 555-1234		www.constructionexemplaire.com	CAD	30% ├á la commande, le solde avant exp├®dition	c38fd45c-356b-4b5e-a9a0-3c2258201d9e	27	30	0	0	\N		TPS/TVQ	50000	Thomas Leguen de Kergolan	fr	Imperial	FOB	96e8bd0e-67dd-412b-81b7-49f7e8cef1e0		\N	\N	1.4	CAD	9	f		2025-12-13 01:43:39.225	2025-12-14 16:13:47.257	1	31
5501fae5-5dd9-4ea8-ba80-386f53230d97	Excavation Montauban	Client	EXCMON	\N	+1 (418) 336-2525		www.allobato.com	CAD	net 30 jours avec 0% d'escompte si paiement re├ºu par VIREMENT BANCAIRE chez DRC avant 0 jours	bcee4fc8-48c5-4b3d-9c95-8d5f16ac53a9	30	30	10	23	\N		TPS/TVQ	10000	Steve Pouliot	fr	Imperial	Saisie Libre	df457872-7df9-494f-9f3b-308e4791f5b1	FOB Paris	\N	\N	1.4	CAD	9	f		2025-12-13 02:18:32.257	2025-12-13 19:03:08.281	1	31
d62a2e24-ddd6-486f-9ba3-3ceab2750f29	Polycor	Supplier	POLCOR	\N	+1 (418) 692-4695		www.polycor.com	CAD	net 60 jours apr├¿s date de facturation	a3952689-f898-4c05-b91d-301e68feecdd	60	0	0	0	\N	Fournisseur de pierre	TPS/TVQ	250000		fr	Imperial	Ex Works	46ccef01-0f67-49d4-b730-66cb1849f312		/uploads/pricelist-1765592717874-296178106.pdf	Prix 2024	\N	\N	\N	\N		2025-12-13 02:25:32.25	2025-12-13 18:05:24.53	\N	\N
b24310d9-56e8-450b-9fca-1fd214ac39bc	Garage LP	Supplier	GARLP	\N	+1 (819) 876-5242			CAD	net 30 jours apr├¿s date de facturation	a3952689-f898-4c05-b91d-301e68feecdd	30	0	0	0	\N	Fournisseurs de pi├¿ce	TPS/TVQ	2000		fr	Imperial	Ex Works	46ccef01-0f67-49d4-b730-66cb1849f312		\N	\N	\N	\N	\N	\N		2025-12-13 02:30:04.965	2025-12-13 18:04:45.1	\N	\N
3289b663-9736-42da-957c-49ba632dbe59	Vermont Stone Art	Client	VERSTO	\N	+1 (802) 505-2503	+1 (802) 655-5841	www.vermontstoneart.com	USD	30% deposit on confirmation of order, balance net 30 days after date of production	bbafa2cc-144b-48cc-a06d-5d144f473141	30	30	3	15	\N		Exempt	300000	Thomas Leguen de Kergolan	en	Imperial	Ex Works	46ccef01-0f67-49d4-b730-66cb1849f312		\N	\N	1.4	USD	9	f		2025-12-13 18:37:26.965	2025-12-13 21:13:03.832	1	30
adea804f-3ccc-4e9b-9034-7c0f79be6e0e	Construction Exemplaire Inc.	Client	C-EXEMPLE	info@constructionexemplaire.com	450-555-1234	\N	www.constructionexemplaire.com	CAD	Net 30	\N	0	0	0	0	\N	\N	TPS/TVQ	50000	Steve Pouliot	fr	Imperial	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-17 16:04:49.68	2025-12-17 16:04:49.68	\N	\N
59c931e9-7959-4d4d-b0fb-6b3183bfb1ea	Stone Supplier Import	Supplier	F-STONE	orders@stonesupplier.com	888-555-9999	\N	\N	USD	Net 30	\N	0	0	0	0	\N	Stone	\N	\N	\N	en	Imperial	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-17 16:04:50.992	2025-12-17 16:04:50.992	\N	\N
\.


--
-- Name: Address Address_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Address"
    ADD CONSTRAINT "Address_pkey" PRIMARY KEY (id);


--
-- Name: ContactType ContactType_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ContactType"
    ADD CONSTRAINT "ContactType_pkey" PRIMARY KEY (id);


--
-- Name: Contact Contact_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Contact"
    ADD CONSTRAINT "Contact_pkey" PRIMARY KEY (id);


--
-- Name: Currency Currency_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Currency"
    ADD CONSTRAINT "Currency_pkey" PRIMARY KEY (id);


--
-- Name: EquipmentCategory EquipmentCategory_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."EquipmentCategory"
    ADD CONSTRAINT "EquipmentCategory_pkey" PRIMARY KEY (id);


--
-- Name: Equipment Equipment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Equipment"
    ADD CONSTRAINT "Equipment_pkey" PRIMARY KEY (id);


--
-- Name: Incoterm Incoterm_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Incoterm"
    ADD CONSTRAINT "Incoterm_pkey" PRIMARY KEY (id);


--
-- Name: Language Language_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Language"
    ADD CONSTRAINT "Language_pkey" PRIMARY KEY (id);


--
-- Name: MaintenanceSite MaintenanceSite_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MaintenanceSite"
    ADD CONSTRAINT "MaintenanceSite_pkey" PRIMARY KEY (id);


--
-- Name: Material Material_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Material"
    ADD CONSTRAINT "Material_pkey" PRIMARY KEY (id);


--
-- Name: PartCategory PartCategory_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PartCategory"
    ADD CONSTRAINT "PartCategory_pkey" PRIMARY KEY (id);


--
-- Name: Part Part_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Part"
    ADD CONSTRAINT "Part_pkey" PRIMARY KEY (id);


--
-- Name: PaymentTerm PaymentTerm_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PaymentTerm"
    ADD CONSTRAINT "PaymentTerm_pkey" PRIMARY KEY (id);


--
-- Name: ProductionSite ProductionSite_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductionSite"
    ADD CONSTRAINT "ProductionSite_pkey" PRIMARY KEY (id);


--
-- Name: ProjectLocation ProjectLocation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProjectLocation"
    ADD CONSTRAINT "ProjectLocation_pkey" PRIMARY KEY (id);


--
-- Name: Project Project_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Project"
    ADD CONSTRAINT "Project_pkey" PRIMARY KEY (id);


--
-- Name: QuoteItem QuoteItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."QuoteItem"
    ADD CONSTRAINT "QuoteItem_pkey" PRIMARY KEY (id);


--
-- Name: Quote Quote_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Quote"
    ADD CONSTRAINT "Quote_pkey" PRIMARY KEY (id);


--
-- Name: RepairPart RepairPart_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RepairPart"
    ADD CONSTRAINT "RepairPart_pkey" PRIMARY KEY (id);


--
-- Name: RepairRequest RepairRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RepairRequest"
    ADD CONSTRAINT "RepairRequest_pkey" PRIMARY KEY (id);


--
-- Name: Representative Representative_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Representative"
    ADD CONSTRAINT "Representative_pkey" PRIMARY KEY (id);


--
-- Name: Setting Setting_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Setting"
    ADD CONSTRAINT "Setting_pkey" PRIMARY KEY (id);


--
-- Name: SystemConfig SystemConfig_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SystemConfig"
    ADD CONSTRAINT "SystemConfig_pkey" PRIMARY KEY (id);


--
-- Name: ThirdParty ThirdParty_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ThirdParty"
    ADD CONSTRAINT "ThirdParty_pkey" PRIMARY KEY (id);


--
-- Name: ContactType_name_category_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ContactType_name_category_key" ON public."ContactType" USING btree (name, category);


--
-- Name: Currency_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Currency_code_key" ON public."Currency" USING btree (code);


--
-- Name: EquipmentCategory_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "EquipmentCategory_name_key" ON public."EquipmentCategory" USING btree (name);


--
-- Name: Equipment_internalId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Equipment_internalId_key" ON public."Equipment" USING btree ("internalId");


--
-- Name: Language_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Language_code_key" ON public."Language" USING btree (code);


--
-- Name: MaintenanceSite_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "MaintenanceSite_name_key" ON public."MaintenanceSite" USING btree (name);


--
-- Name: PartCategory_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "PartCategory_name_key" ON public."PartCategory" USING btree (name);


--
-- Name: PaymentTerm_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "PaymentTerm_code_key" ON public."PaymentTerm" USING btree (code);


--
-- Name: ProductionSite_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ProductionSite_name_key" ON public."ProductionSite" USING btree (name);


--
-- Name: ProjectLocation_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ProjectLocation_name_key" ON public."ProjectLocation" USING btree (name);


--
-- Name: Project_reference_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Project_reference_key" ON public."Project" USING btree (reference);


--
-- Name: Quote_reference_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Quote_reference_key" ON public."Quote" USING btree (reference);


--
-- Name: RepairRequest_reference_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "RepairRequest_reference_key" ON public."RepairRequest" USING btree (reference);


--
-- Name: Setting_key_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Setting_key_key" ON public."Setting" USING btree (key);


--
-- Name: SystemConfig_key_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "SystemConfig_key_key" ON public."SystemConfig" USING btree (key);


--
-- Name: ThirdParty_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ThirdParty_code_key" ON public."ThirdParty" USING btree (code);


--
-- Name: Address Address_thirdPartyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Address"
    ADD CONSTRAINT "Address_thirdPartyId_fkey" FOREIGN KEY ("thirdPartyId") REFERENCES public."ThirdParty"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Contact Contact_thirdPartyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Contact"
    ADD CONSTRAINT "Contact_thirdPartyId_fkey" FOREIGN KEY ("thirdPartyId") REFERENCES public."ThirdParty"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Equipment Equipment_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Equipment"
    ADD CONSTRAINT "Equipment_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."EquipmentCategory"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Equipment Equipment_siteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Equipment"
    ADD CONSTRAINT "Equipment_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES public."MaintenanceSite"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Material Material_supplierId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Material"
    ADD CONSTRAINT "Material_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES public."ThirdParty"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Part Part_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Part"
    ADD CONSTRAINT "Part_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."PartCategory"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Part Part_siteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Part"
    ADD CONSTRAINT "Part_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES public."MaintenanceSite"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Project Project_locationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Project"
    ADD CONSTRAINT "Project_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES public."ProjectLocation"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Project Project_thirdPartyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Project"
    ADD CONSTRAINT "Project_thirdPartyId_fkey" FOREIGN KEY ("thirdPartyId") REFERENCES public."ThirdParty"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: QuoteItem QuoteItem_productionSiteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."QuoteItem"
    ADD CONSTRAINT "QuoteItem_productionSiteId_fkey" FOREIGN KEY ("productionSiteId") REFERENCES public."ProductionSite"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: QuoteItem QuoteItem_quoteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."QuoteItem"
    ADD CONSTRAINT "QuoteItem_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES public."Quote"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Quote Quote_contactId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Quote"
    ADD CONSTRAINT "Quote_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES public."Contact"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Quote Quote_incotermId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Quote"
    ADD CONSTRAINT "Quote_incotermId_fkey" FOREIGN KEY ("incotermId") REFERENCES public."Incoterm"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Quote Quote_materialId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Quote"
    ADD CONSTRAINT "Quote_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES public."Material"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Quote Quote_paymentTermId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Quote"
    ADD CONSTRAINT "Quote_paymentTermId_fkey" FOREIGN KEY ("paymentTermId") REFERENCES public."PaymentTerm"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Quote Quote_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Quote"
    ADD CONSTRAINT "Quote_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Quote Quote_representativeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Quote"
    ADD CONSTRAINT "Quote_representativeId_fkey" FOREIGN KEY ("representativeId") REFERENCES public."Representative"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Quote Quote_thirdPartyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Quote"
    ADD CONSTRAINT "Quote_thirdPartyId_fkey" FOREIGN KEY ("thirdPartyId") REFERENCES public."ThirdParty"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: RepairPart RepairPart_partId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RepairPart"
    ADD CONSTRAINT "RepairPart_partId_fkey" FOREIGN KEY ("partId") REFERENCES public."Part"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: RepairPart RepairPart_repairRequestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RepairPart"
    ADD CONSTRAINT "RepairPart_repairRequestId_fkey" FOREIGN KEY ("repairRequestId") REFERENCES public."RepairRequest"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RepairRequest RepairRequest_equipmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RepairRequest"
    ADD CONSTRAINT "RepairRequest_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES public."Equipment"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ThirdParty ThirdParty_incotermId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ThirdParty"
    ADD CONSTRAINT "ThirdParty_incotermId_fkey" FOREIGN KEY ("incotermId") REFERENCES public."Incoterm"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ThirdParty ThirdParty_paymentTermId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ThirdParty"
    ADD CONSTRAINT "ThirdParty_paymentTermId_fkey" FOREIGN KEY ("paymentTermId") REFERENCES public."PaymentTerm"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict WAf8YNYUvUBlf0SElpPkDbBmt71XRBwEbjQLohTujOAPtylTS6kf9yc4MGHZG1D

