import "@typespec/http";

using Http;

@service(#{
  title: "Calendar Booking API",
})
namespace CalendarBooking;

model ApiError {
  code: string;
  message: string;
}

model ErrorBody {
  error: ApiError;
}

@error
model BadRequest {
  @statusCode statusCode: 400;
  @body body: ErrorBody;
}

@error
model NotFound {
  @statusCode statusCode: 404;
  @body body: ErrorBody;
}

@error
model Conflict {
  @statusCode statusCode: 409;
  @body body: ErrorBody;
}

@error
model UnprocessableEntity {
  @statusCode statusCode: 422;
  @body body: ErrorBody;
}

model Created<T> {
  @statusCode statusCode: 201;
  @body body: T;
}

model EventType {
  id: string;
  title: string;
  description?: string;
  durationMinutes: int32;
}

model CreateBooking {
  eventTypeId: string;
  start: utcDateTime;
  guestName: string;
  guestEmail: string;
}

model Booking {
  id: string;
  eventTypeId: string;
  guestName: string;
  guestEmail: string;
  start: utcDateTime;
  createdAt: utcDateTime;
}

model OwnerBooking extends Booking {
  eventTypeTitle: string;
  durationMinutes: int32;
}

model DayAvailability {
  date: string;
  startTimes: string[];
}

@route("/event-types")
interface EventTypes {
  @get list(): EventType[];

  @post
  create(
    @body body: EventType,
  ): Created<EventType> | BadRequest | UnprocessableEntity;
}

@route("/availability")
interface Availability {
  @get list(
    @query eventTypeId: string,
    @query from: string,
    @query to: string,
  ): DayAvailability[] | BadRequest | NotFound | UnprocessableEntity;
}

@route("/bookings")
interface Bookings {
  @get list(): OwnerBooking[];

  @post
  create(
    @body body: CreateBooking,
  ): Created<Booking> | BadRequest | NotFound | Conflict | UnprocessableEntity;
}
