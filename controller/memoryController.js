import FamilyMemory from "../models/FamilyMemory.js";
import Patient from "../models/Patient.js";
import AppError from "../utils/appError.js";

// Helper to determine active patient ID whether called by Patient or Caregiver
const resolveTargetPatientId = async (req) => {
  if (req.userRole === "patient" || req.patientId) {
    return req.patientId || req.authenticatedUserId;
  }
  if (req.userRole === "caregiver" || req.caregiverId) {
    const caregiverId = req.caregiverId || req.authenticatedUserId;
    // Allow caregiver to specify target patientId in query/body or resolve linked patient
    const requestedPatientId = req.query.patientId || req.body.patientId;
    if (requestedPatientId) {
      return requestedPatientId;
    }
    const patient = await Patient.findOne({ caregiverId }).select("_id");
    if (!patient) {
      throw new AppError("No patient currently connected to this caregiver", 404);
    }
    return patient._id;
  }
  return req.authenticatedUserId;
};

// GET /api/memories
export const getMemories = async (req, res, next) => {
  try {
    const patientId = await resolveTargetPatientId(req);
    const memories = await FamilyMemory.find({ userId: patientId })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: memories.length,
      memories,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/memories/:id
export const getMemoryById = async (req, res, next) => {
  try {
    const memory = await FamilyMemory.findById(req.params.id).lean();
    if (!memory) {
      return next(new AppError("Memory not found", 404));
    }

    res.status(200).json({
      success: true,
      memory,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/memories
export const createMemory = async (req, res, next) => {
  try {
    const patientId = await resolveTargetPatientId(req);
    const {
      title,
      description,
      date,
      location,
      occasion,
      people = [],
      photos = [],
      coverPhotoUrl,
      voice = { url: "", durationMs: 0 },
    } = req.body;

    if (!title || !title.trim()) {
      return next(new AppError("Memory title is required", 400));
    }

    // Determine cover photo
    let resolvedCoverUrl = coverPhotoUrl || "";
    if (!resolvedCoverUrl && Array.isArray(photos) && photos.length > 0) {
      resolvedCoverUrl = photos[0]?.url || "";
    }

    // Normalize photos array order
    const formattedPhotos = Array.isArray(photos)
      ? photos.map((p, idx) => ({
          url: typeof p === "string" ? p : p.url,
          order: typeof p === "object" && typeof p.order === "number" ? p.order : idx + 1,
          caption: typeof p === "object" && p.caption ? p.caption.trim() : "",
        }))
      : [];

    // Normalize people array
    const formattedPeople = Array.isArray(people)
      ? people.map((person) => {
          if (typeof person === "string") {
            return { name: person.trim(), relation: "" };
          }
          return {
            name: person.name ? person.name.trim() : "Family Member",
            relation: person.relation ? person.relation.trim() : "",
          };
        })
      : [];

    const newMemory = await FamilyMemory.create({
      userId: patientId,
      title: title.trim(),
      description: description ? description.trim() : "",
      date: date ? date.trim() : "",
      location: location ? location.trim() : "",
      occasion: occasion ? occasion.trim() : "",
      people: formattedPeople,
      photos: formattedPhotos,
      coverPhotoUrl: resolvedCoverUrl,
      voice: {
        url: voice?.url || "",
        durationMs: voice?.durationMs || 0,
      },
      createdBy: req.userRole === "caregiver" ? "caregiver" : "patient",
    });

    res.status(201).json({
      success: true,
      message: "Memory successfully added to Family Scrapbook",
      memory: newMemory,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/memories/:id
export const updateMemory = async (req, res, next) => {
  try {
    const memory = await FamilyMemory.findById(req.params.id);
    if (!memory) {
      return next(new AppError("Memory not found", 404));
    }

    const {
      title,
      description,
      date,
      location,
      occasion,
      people,
      photos,
      coverPhotoUrl,
      voice,
    } = req.body;

    if (title !== undefined) memory.title = title.trim();
    if (description !== undefined) memory.description = description.trim();
    if (date !== undefined) memory.date = date.trim();
    if (location !== undefined) memory.location = location.trim();
    if (occasion !== undefined) memory.occasion = occasion.trim();
    if (people !== undefined && Array.isArray(people)) memory.people = people;
    if (photos !== undefined && Array.isArray(photos)) {
      memory.photos = photos;
      if (!coverPhotoUrl && photos.length > 0) {
        memory.coverPhotoUrl = photos[0].url;
      }
    }
    if (coverPhotoUrl !== undefined) memory.coverPhotoUrl = coverPhotoUrl;
    if (voice !== undefined) memory.voice = voice;

    await memory.save();

    res.status(200).json({
      success: true,
      message: "Memory updated successfully",
      memory,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/memories/:id
export const deleteMemory = async (req, res, next) => {
  try {
    const memory = await FamilyMemory.findByIdAndDelete(req.params.id);
    if (!memory) {
      return next(new AppError("Memory not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Memory removed from Family Scrapbook",
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/memories/media (utility endpoint to accept and echo/store media references)
export const uploadMedia = async (req, res, next) => {
  try {
    const { dataUri, type } = req.body;
    if (!dataUri) {
      return next(new AppError("Media data is required", 400));
    }

    // In a production server, this could save to S3/Cloud Storage or disk.
    // For direct resilient persistence, dataUri is stored and served cleanly.
    res.status(200).json({
      success: true,
      url: dataUri,
      type: type || "image",
    });
  } catch (error) {
    next(error);
  }
};
