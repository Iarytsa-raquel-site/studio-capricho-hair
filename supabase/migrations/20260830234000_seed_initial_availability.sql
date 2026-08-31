-- Agenda inicial coerente com o funcionamento legado: terça a sábado,
-- com início a cada hora das 09h às 17h (atendimento até 18h).

insert into public.availability (available_date, start_time, active, blocked)
select day::date, make_time(hour_of_day, 0, 0), true, false
from generate_series(current_date, current_date + 44, interval '1 day') day
cross join generate_series(9, 17) hour_of_day
where extract(dow from day) between 2 and 6
on conflict (available_date, start_time) do nothing;
