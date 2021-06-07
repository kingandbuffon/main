CREATE TABLE public.img_data (
	id serial NOT NULL,
	hyperlink varchar NOT NULL,
	img_type varchar NULL,
	date_add timestamp NULL DEFAULT now()
);
