// api/stay/normalizeStayPayload.js
export function normalizeStayPayload(input, user) {
    const now = Date.now()
    const id = input._id || `s${now}`

    const imgsArr = Array.isArray(input.imgs)
        ? input.imgs.filter(Boolean)
        : (input.imgUrl ? [input.imgUrl] : [])
    const imgs = Array.from(new Set(imgsArr.map(String)))

    const loc = {
        country: input.loc?.country || input.country || '',
        city: input.loc?.city || input.city || '',
        lat: typeof input.loc?.lat === 'number' ? input.loc.lat : (typeof input.lat === 'number' ? input.lat : 0),
        lng: typeof input.loc?.lng === 'number' ? input.loc.lng : (typeof input.lng === 'number' ? input.lng : 0),
        address: input.loc?.address || input.address || [input.city, input.country].filter(Boolean).join(', ')
    }

    const highlights = Array.isArray(input.highlights)
        ? input.highlights.map(h => ({
            icon: h.icon || '',
            title: h.title || '',
            desc: h.desc || ''
        }))
        : []

    const amenities = Array.isArray(input.amenities) ? input.amenities.slice() : []

    const ratings = {
        avg: typeof input.ratings?.avg === 'number' ? input.ratings.avg : 0,
        count: typeof input.ratings?.count === 'number' ? input.ratings.count : 0,
        overall: typeof input.ratings?.overall === 'number' ? input.ratings.overall : 0,
        categories: {
            cleanliness: input.ratings?.categories?.cleanliness ?? 0,
            accuracy: input.ratings?.categories?.accuracy ?? 0,
            checkIn: input.ratings?.categories?.checkIn ?? 0,
            communication: input.ratings?.categories?.communication ?? 0,
            location: input.ratings?.categories?.location ?? 0,
            value: input.ratings?.categories?.value ?? 0
        },
        cleanliness: input.ratings?.cleanliness ?? 0
    }

    const host = {
        _id: String(user?._id || input.host?._id || ''),
        fullname: user?.fullname || input.host?.fullname || '',
        imgUrl: user?.imgUrl || input.host?.imgUrl || '',
        role: input.host?.role || '',
        favoritesong: input.host?.favoritesong || '',
        bio: input.host?.bio || '',
        isSuperhost: Boolean(input.host?.isSuperhost),
        monthsHosting: Number(input.host?.monthsHosting || 0),
        reviews: Number(input.host?.reviews || 0),
        rating: Number(input.host?.rating || 0),
        responseRate: Number(input.host?.responseRate || 0),
        responseTime: input.host?.responseTime || '',
        location: input.host?.location,
        about: input.host?.about,
        thumbnailUrl: input.host?.thumbnailUrl,
        pictureUrl: input.host?.pictureUrl,
        id: input.host?.id
    }

    const out = {
        _id: id,
        hostId: String(user?._id || input.hostId || ''),
        title: String(input.title || '').trim(),
        price: Number(input.price || 0),
        loc,
        imgs,
        summary: input.summary || '',
        maxGuests: Number(input.maxGuests || 1),
        bedRooms: Number(input.bedRooms || 1),
        baths: Number(input.baths || 1),
        highlights,
        amenities,
        ratings,
        houseRules: Array.isArray(input.houseRules) ? input.houseRules.slice() : [],
        safety: Array.isArray(input.safety) ? input.safety.slice() : [],
        cancellationPolicy: Array.isArray(input.cancellationPolicy) ? input.cancellationPolicy.slice() : [],
        host
    }

    if (input.beds != null) out.beds = Number(input.beds)
    return out
}
